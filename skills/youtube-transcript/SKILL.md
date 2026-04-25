name: youtube-transcript

description: Extract transcripts from or download YouTube videos. Use when the user
asks for a transcript, subtitles, captions, or spoken text from a YouTube video, OR
when they want to download a YouTube video. Accepts youtube.com/watch?v=,
youtube.com/shorts/, youtu.be/, or raw video IDs.

# YouTube Transcript & Downloader

Uses Puppeteer (headless Chromium) to bypass YouTube's IP-level bot detection that
blocks direct API calls from server environments.

## How it works — Transcript
1. Opens YouTube in a headless browser
2. Clicks the "More" (⋮) menu then "Show transcript"
3. Intercepts the `get_panel` API response containing all transcript segments

## How it works — Download
1. Opens YouTube in a headless browser and plays the video
2. Intercepts the actual `googlevideo.com/videoplayback` CDN requests Chrome makes
3. Downloads best quality video + audio streams with ffmpeg, then merges to mp4

> **Note:** Download requires a residential/non-datacenter IP. Google's CDN blocks
> videoplayback requests from cloud/server IPs with 403. Transcript extraction is
> unaffected (uses a different API path). If download fails with a 403/stream error,
> it must be run from a local machine.

## Requirements

- Node.js (v16+)
- puppeteer: `cd /tmp && npm install puppeteer`
- ffmpeg (for download): `sudo apt install ffmpeg`

## Usage

**Transcript:**
```
node /home/tj/.claude/skills/youtube-transcript/get_transcript.js "VIDEO_URL_OR_ID"
node /home/tj/.claude/skills/youtube-transcript/get_transcript.js "VIDEO_URL_OR_ID" --timestamps
```

**Download:**
```
node /home/tj/.claude/skills/youtube-transcript/get_transcript.js "VIDEO_URL_OR_ID" --download
node /home/tj/.claude/skills/youtube-transcript/get_transcript.js "VIDEO_URL_OR_ID" --download --output /path/to/video.mp4
```

## Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- Raw video ID (11 characters)

## Steps to follow

1. Ensure puppeteer is installed: `ls /tmp/node_modules/puppeteer 2>/dev/null || (cd /tmp && npm install puppeteer)`
2. For downloads, ensure ffmpeg is installed: `which ffmpeg`
3. Run the script with the provided URL and flags
4. For transcripts: display to user as clean paragraphs (never modify the text)
5. For downloads: report the saved file path

## Output rules

- NEVER modify the returned transcript text
- If no timestamps requested, present transcript as clean flowing paragraphs
- For downloads, default output file is `<video_id>.mp4` in the current directory
