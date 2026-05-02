#!/bin/bash
# Task: FFmpeg audio/video processing
# Runs ON the remote instance
# ENV vars: FFMPEG_CMD (custom ffmpeg args), or auto-detects common operations

set -e
export PATH="$PATH:/usr/bin"

INPUT_FILE=$(ls ~/input/* 2>/dev/null | head -1)
OUTPUT_DIR="$HOME/output"
mkdir -p "$OUTPUT_DIR"
BASE=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')
EXT="${INPUT_FILE##*.}"

echo "[ffmpeg] Input: $INPUT_FILE"
echo "[ffmpeg] FFmpeg: $(ffmpeg -version 2>&1 | head -1)"

if [ -n "$FFMPEG_CMD" ]; then
  # Custom command — user supplies full args
  echo "[ffmpeg] Running custom: $FFMPEG_CMD"
  cd ~/input && eval "$FFMPEG_CMD" </dev/null
elif [[ "$EXT" =~ ^(mp4|mkv|avi|mov|webm)$ ]]; then
  # Video: extract audio as mp3
  echo "[ffmpeg] Extracting audio from video..."
  ffmpeg -i "$INPUT_FILE" -q:a 0 -map a "$OUTPUT_DIR/${BASE}.mp3" -y </dev/null
  # Also create a compressed version
  ffmpeg -i "$INPUT_FILE" -vcodec libx264 -crf 28 "$OUTPUT_DIR/${BASE}_compressed.mp4" -y </dev/null
elif [[ "$EXT" =~ ^(mp3|wav|m4a|aac|ogg|flac)$ ]]; then
  # Audio: convert to mp3 + wav 16kHz mono (optimised for STT)
  echo "[ffmpeg] Converting audio..."
  ffmpeg -i "$INPUT_FILE" -q:a 2 "$OUTPUT_DIR/${BASE}.mp3" -y </dev/null
  ffmpeg -i "$INPUT_FILE" -ar 16000 -ac 1 "$OUTPUT_DIR/${BASE}_16k_mono.wav" -y </dev/null
else
  echo "[ffmpeg] Unknown type, running info only..."
  ffmpeg -i "$INPUT_FILE" 2>&1 </dev/null | tee "$OUTPUT_DIR/${BASE}_info.txt"
fi

echo "[ffmpeg] Done. Output files:"
ls -lh "$OUTPUT_DIR/"
