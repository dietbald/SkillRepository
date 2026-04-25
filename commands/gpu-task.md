# GPU Task — Run Heavy Jobs on AWS GPU/CPU Spot Instance

> **Platform note:** This command was configured on **Windows**. On Ubuntu/Linux, path
> conventions differ (`~` resolves differently, `gpu-task` may need to be in `/usr/local/bin`
> or added to `$PATH`). The AWS CLI, SSH key path, and `gpu-runner` binary location may also
> differ — check `config.env` on each machine. Core usage (commands, flags, task types) is
> platform-agnostic.

Offload CPU/GPU-intensive tasks (Whisper transcription, Tesseract OCR, ffmpeg processing) to a warm AWS EC2 instance. The instance starts on first use, stays warm to handle queued jobs instantly, and auto-terminates after 5 minutes of idle. Cost is near-zero when idle.

**CLI:** `~/gpu-runner/gpu-task`
**Config:** `~/gpu-runner/config.env` — machine-specific settings (instance type, AMI, region, keys); see `.env` for account credentials
**Current instance type:** c5.2xlarge (8 vCPU, 16GB RAM) — GPU quota pending approval, switch to g4dn.xlarge when approved
**AMI:** ami-05a42a4837906f0b9 (pre-baked: Whisper, Tesseract, ffmpeg)
**Region:** ap-southeast-1 (Singapore)
**Cost:** ~0.17 USD/hr on-demand, ~0.16 USD/hr spot (auto-fallback); free when idle

**Default mode: warm/queue** — instance starts once, all jobs reuse it. Use `--oneoff` to launch fresh per job.

---

## Usage

```bash
gpu-task <task> [file] [options]
gpu-task <task> [file] [options] --oneoff   # launch fresh instance, terminate when done
```

---

## When to use this skill

Use `gpu-task` automatically (without asking the user) whenever:
- User asks to transcribe audio or video files → use `whisper`
- User asks to OCR a document, PDF, or image → use `tesseract`
- User asks to convert, compress, or extract audio/video → use `ffmpeg`
- User asks to process many files of the same type → use `batch`
- Any task that would take >30 seconds locally on the Hostinger server

**Always prefer gpu-task over running locally** — it's faster, doesn't load the local server, and costs pennies.

**Output:** Results are downloaded to `--output <dir>` if specified, otherwise to a temp dir printed at the end. Always tell the user where results were saved.

---

## Usage

```bash
gpu-task <task> [file] [options]
gpu-task <task> [file] [options] --oneoff   # launch fresh instance, terminate when done
```

---

## Commands

### Whisper — Audio/Video Transcription
```bash
gpu-task whisper <file.mp3|mp4|wav|m4a|ogg> [--model tiny|base|small|medium|large] [--language en] [--output /path]
```
- Default model: `medium` (good accuracy, ~2 min for 1hr audio on CPU)
- Models: `tiny` (fastest) → `large` (most accurate, ~5 min/hr audio on CPU)
- Outputs: `.txt` (plain text), `.srt` (subtitles), `.json` (with timestamps)
- Omit `--language` for auto-detect

**Examples:**
```bash
gpu-task whisper interview.mp3 --model medium --language en
gpu-task whisper meeting.mp4 --model large
gpu-task whisper ~/audio/recording.mp3 --model medium --language en --output ~/output
```

---

### Tesseract — OCR (Images & PDFs)
```bash
gpu-task tesseract <file.pdf|jpg|png|tiff> [--output /path]
```
- Supports: PDF (all pages), PNG, JPG, TIFF, BMP
- Outputs: `.txt` per file (PDFs get `_full.txt` combining all pages)

**Examples:**
```bash
gpu-task tesseract contract.pdf --output ~/documents/ocr
gpu-task tesseract scanned_invoice.jpg
```

---

### FFmpeg — Audio/Video Processing
```bash
gpu-task ffmpeg <file> [--cmd 'custom ffmpeg args'] [--output /path]
```
- Auto-detects file type:
  - **Audio** (mp3/wav/m4a): converts to mp3 + 16kHz mono WAV (optimised for STT)
  - **Video** (mp4/mkv/avi): extracts audio as mp3 + compressed mp4
- Use `--cmd` for custom ffmpeg operations

**Examples:**
```bash
gpu-task ffmpeg recording.mp4
gpu-task ffmpeg video.mp4 --cmd 'ffmpeg -i video.mp4 -ss 00:01:00 -t 30 clip.mp4'
```

---

### Batch — Multiple Files, One Instance
```bash
gpu-task batch <task> <file1> <file2> ... [options]
```
- Processes all files on a SINGLE instance — one spin-up, one shutdown
- Use this instead of calling gpu-task separately for each file

**Examples:**
```bash
gpu-task batch whisper ~/interviews/*.mp3 --model medium --language en
gpu-task batch tesseract ~/documents/*.pdf --output ~/ocr
gpu-task batch ffmpeg ~/videos/*.mp4
```

---

### Custom Command
```bash
gpu-task run '<shell command>' [--input file1 file2] [--output /path]
```

**Example:**
```bash
gpu-task run 'python3 train.py' --input train.py dataset.csv --output ~/results
```

---

### Instance Management
```bash
gpu-task list                  # show running instances
gpu-task kill <instance-id>    # terminate manually
gpu-task keepwarm              # start warm instance (no job) — stays alive 5min idle
gpu-task setup-ami             # rebuild pre-baked AMI (after adding new tools)
```

---

## GPU vs CPU speeds

g4dn.xlarge (NVIDIA T4) vs c5.2xlarge:
- Whisper `large` model: ~30s/hr audio on GPU vs ~5min/hr on CPU
- Whisper `medium` model: ~15s/hr audio on GPU

---

## AWS Details
> Account credentials, AMI ID, SSH key path, and security group are machine-specific.
> Store them in `~/.claude/commands/.env` (or `~/gpu-runner/config.env`) — never commit them.
>
> Keys needed: `GPU_AWS_ACCOUNT`, `GPU_AMI_ID`, `GPU_SECURITY_GROUP`, `GPU_SSH_KEY_PATH`, `GPU_IAM_USER`
