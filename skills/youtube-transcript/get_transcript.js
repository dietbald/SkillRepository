#!/usr/bin/env node
/**
 * YouTube Transcript & Downloader
 * Uses Puppeteer to bypass bot detection and either:
 *   - Extract transcript via the get_panel API
 *   - Download video+audio via intercepted stream URLs + ffmpeg merge
 *
 * Usage:
 *   node get_transcript.js <url_or_id> [--timestamps]
 *   node get_transcript.js <url_or_id> --download [--output path/to/file.mp4]
 */

const puppeteer = require('puppeteer');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractVideoId(input) {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  throw new Error(`Could not extract video ID from: ${input}`);
}

function pickBestFormat(formats, type) {
  // Filter by mime type and sort by quality
  const filtered = formats
    .filter(f => f.mimeType && f.mimeType.startsWith(type) && f.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  return filtered[0] || null;
}

async function openPage(videoId) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setRequestInterception(true);
  page.on('request', req => req.continue());
  return { browser, page };
}

// ── TRANSCRIPT ────────────────────────────────────────────────────────────────

async function getTranscript(videoId, withTimestamps = false) {
  const { browser, page } = await openPage(videoId);
  try {
    let panelData = null;
    page.on('response', async res => {
      if (res.url().includes('get_panel')) {
        try { panelData = await res.json(); } catch (_) {}
      }
    });

    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: 'networkidle2', timeout: 30000
    });
    await new Promise(r => setTimeout(r, 2000));

    // Click More → Show transcript
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.getAttribute('aria-label') === 'More');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        if (el.children.length === 0 && el.textContent.trim().toLowerCase() === 'show transcript') {
          el.click(); return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 5000));

    if (!panelData) throw new Error('No transcript data received. Video may not have captions.');

    const segments = [];
    function findSegments(obj) {
      if (Array.isArray(obj)) { obj.forEach(findSegments); return; }
      if (typeof obj !== 'object' || !obj) return;
      if (obj.transcriptSegmentViewModel) { segments.push(obj.transcriptSegmentViewModel); return; }
      for (const v of Object.values(obj)) findSegments(v);
    }
    findSegments(panelData);

    if (segments.length === 0) throw new Error('No transcript segments found in response.');

    return segments.map(seg => {
      const text = seg.simpleText || '';
      return withTimestamps ? `[${seg.timestamp}] ${text}` : text;
    }).join('\n');

  } finally {
    await browser.close();
  }
}

// ── DOWNLOAD ──────────────────────────────────────────────────────────────────

async function downloadVideo(videoId, outputPath) {
  // Check ffmpeg
  try { execSync('which ffmpeg', { stdio: 'ignore' }); }
  catch (_) { throw new Error('ffmpeg is required for download. Install with: sudo apt install ffmpeg'); }

  const { browser, page } = await openPage(videoId);
  try {
    // Intercept actual CDN stream requests Chrome makes when playing the video
    const videoStreams = new Map();
    const audioStreams = new Map();

    page.on('response', async res => {
      const url = res.url();
      if (!url.includes('googlevideo.com')) return;
      const hdrs = res.headers();
      const ct = hdrs['content-type'] || '';
      const cl = parseInt(hdrs['content-length'] || '0');
      if (!ct || cl < 10000) return;

      const itagMatch = url.match(/[?&]itag=(\d+)/);
      const itag = itagMatch ? itagMatch[1] : url.length.toString();
      const entry = { url, contentType: ct, contentLength: cl };

      if (ct.startsWith('video/')) {
        if (!videoStreams.has(itag) || cl > (videoStreams.get(itag)?.contentLength || 0))
          videoStreams.set(itag, entry);
      } else if (ct.startsWith('audio/')) {
        if (!audioStreams.has(itag) || cl > (audioStreams.get(itag)?.contentLength || 0))
          audioStreams.set(itag, entry);
      }
    });

    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: 'networkidle2', timeout: 30000
    });

    // Trigger playback so Chrome fetches the stream URLs
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) { video.muted = true; video.play(); }
    });

    process.stderr.write('Waiting for stream URLs');
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      process.stderr.write('.');
      if (videoStreams.size > 0 && audioStreams.size > 0) break;
    }
    process.stderr.write('\n');

    if (videoStreams.size === 0 && audioStreams.size === 0) {
      throw new Error('No stream URLs intercepted. The video may require login to stream.');
    }

    const bestVideo = [...videoStreams.values()].sort((a, b) => b.contentLength - a.contentLength)[0];
    const bestAudio = [...audioStreams.values()].sort((a, b) => b.contentLength - a.contentLength)[0];

    const cookies = await page.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const ffHeaders = [
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      '-headers', `Cookie: ${cookieHeader}\r\nReferer: https://www.youtube.com/\r\n`
    ];

    if (bestVideo && bestAudio) {
      process.stderr.write(`Video: ${bestVideo.contentType} (${(bestVideo.contentLength/1024/1024).toFixed(1)}MB)\n`);
      process.stderr.write(`Audio: ${bestAudio.contentType} (${(bestAudio.contentLength/1024/1024).toFixed(1)}MB)\n`);
      const tmpVideo = `/tmp/yt_video_${videoId}.tmp`;
      const tmpAudio = `/tmp/yt_audio_${videoId}.tmp`;
      process.stderr.write('Downloading video stream...\n');
      await ffmpegDownload(ffHeaders, bestVideo.url, tmpVideo);
      process.stderr.write('Downloading audio stream...\n');
      await ffmpegDownload(ffHeaders, bestAudio.url, tmpAudio);
      process.stderr.write('Merging...\n');
      await ffmpegMerge(tmpVideo, tmpAudio, outputPath);
      try { fs.unlinkSync(tmpVideo); fs.unlinkSync(tmpAudio); } catch (_) {}
    } else if (bestVideo) {
      process.stderr.write(`Downloading stream (${bestVideo.contentType})...\n`);
      await ffmpegDownload(ffHeaders, bestVideo.url, outputPath);
    } else {
      throw new Error('No suitable streams found.');
    }

    process.stderr.write(`Saved to: ${outputPath}\n`);
    return outputPath;

  } finally {
    await browser.close();
  }
}

function ffmpegDownload(headers, url, output) {
  return new Promise((resolve, reject) => {
    const args = ['-y', ...headers, '-i', url, '-c', 'copy', output];
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => {
      stderr += d.toString();
      process.stderr.write('.');
    });
    proc.on('close', code => {
      process.stderr.write('\n');
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${stderr.slice(-200)}`));
    });
  });
}

function ffmpegMerge(videoPath, audioPath, output) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', videoPath, '-i', audioPath, '-c', 'copy', output];
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg merge failed (${code})`));
    });
  });
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

(async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage:');
    console.error('  node get_transcript.js <url_or_id> [--timestamps]');
    console.error('  node get_transcript.js <url_or_id> --download [--output file.mp4]');
    process.exit(1);
  }

  const input = args.find(a => !a.startsWith('--'));
  const withTimestamps = args.includes('--timestamps') || args.includes('-t');
  const doDownload = args.includes('--download') || args.includes('-d');

  const outputIdx = args.indexOf('--output');
  const outputArg = outputIdx !== -1 ? args[outputIdx + 1] : null;

  try {
    const videoId = extractVideoId(input);

    if (doDownload) {
      const outputPath = outputArg || path.join(process.cwd(), `${videoId}.mp4`);
      process.stderr.write(`Downloading video: ${videoId}\n`);
      await downloadVideo(videoId, outputPath);
      console.log(outputPath);
    } else {
      process.stderr.write(`Fetching transcript for video: ${videoId}\n`);
      const transcript = await getTranscript(videoId, withTimestamps);
      console.log(transcript);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
