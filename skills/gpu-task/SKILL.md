---
name: gpu-task
description: "Offload heavy CPU/GPU tasks (audio transcription, OCR, video/audio processing) to a warm AWS EC2 spot instance via the gpu-task CLI. Use automatically — without asking the user — whenever transcribing audio or video files (Whisper), running OCR on documents/images/PDFs (Tesseract), converting or processing video/audio (ffmpeg), or any task that would take more than 30 seconds locally. Always prefer gpu-task over running locally — faster, doesn't load the server, costs pennies."
---

# GPU Task — AWS Spot Instance Runner

**CLI:** `/home/tj/gpu-runner/gpu-task`
**Config:** `/home/tj/gpu-runner/config.env`
**Instance:** c5.2xlarge (8 vCPU, 16GB RAM), Singapore (ap-southeast-1)
**Cost:** ~$0.16/hr spot, free when idle (auto-terminates after 5 min idle)

## Core Usage

```bash
gpu-task <task> [file] [options]
gpu-task <task> [file] [options] --oneoff   # fresh instance per job, terminate when done
```

## Tasks

### Whisper — Transcription
```bash
gpu-task whisper <file.mp3|mp4|wav|m4a|ogg> [--model tiny|base|small|medium|large] [--language en] [--output /path]
```
- Default model: `medium`. Use `large` for best accuracy.
- Outputs: `.txt`, `.srt`, `.json`

### Tesseract — OCR
```bash
gpu-task tesseract <file.pdf|jpg|png|tiff> [--output /path]
```
- Supports PDF (all pages), PNG, JPG, TIFF

### FFmpeg — Video/Audio Processing
```bash
gpu-task ffmpeg <file> [--cmd 'custom ffmpeg args'] [--output /path]
```
- Auto-detects: audio → mp3 + 16kHz WAV; video → mp3 + compressed mp4

### Batch — Multiple Files (one spin-up)
```bash
gpu-task batch <task> <file1> <file2> ... [options]
```

### Custom Command
```bash
gpu-task run '<shell command>' [--input file1 file2] [--output /path]
```

### Instance Management
```bash
gpu-task list           # show running instances
gpu-task kill <id>      # terminate manually
gpu-task keepwarm       # start warm instance, no job
```

## Notes
- Always tell the user where results were saved after completion
- Omit `--language` for auto-detect
- GPU quota pending — currently CPU (c5.2xlarge). Switch to g4dn.xlarge when approved
- AWS credentials: `~/.aws/credentials` (IAM user: gpu-runner, account: 145554226357)
- SSH key: `~/.ssh/gpu-runner.pem`
