#!/bin/bash
# Task: Whisper speech-to-text transcription
# Runs ON the remote instance

set -e
export PATH="$PATH:/home/ubuntu/.local/bin"

INPUT_FILE=$(ls ~/input/*.mp3 ~/input/*.mp4 ~/input/*.wav ~/input/*.m4a ~/input/*.webm ~/input/*.ogg ~/input/*.flac ~/input/*.mkv ~/input/*.avi 2>/dev/null | head -1)
MODEL="${WHISPER_MODEL:-medium}"
LANGUAGE="${WHISPER_LANGUAGE:-}"

echo "[whisper] Input: $INPUT_FILE"
echo "[whisper] Model: $MODEL"

mkdir -p "$HOME/output"

python3 - <<PYEOF
import whisper, json, os, sys

input_file  = "$INPUT_FILE"
model_name  = "$MODEL"
language    = "$LANGUAGE" or None
output_dir  = os.path.expanduser("~/output")

print(f"[whisper] Loading model: {model_name}")
model = whisper.load_model(model_name)

print(f"[whisper] Transcribing...")
result = model.transcribe(input_file, language=language, verbose=False)

base = os.path.splitext(os.path.basename(input_file))[0]

with open(f"{output_dir}/{base}.txt", "w") as f:
    f.write(result["text"].strip())

with open(f"{output_dir}/{base}.json", "w") as f:
    json.dump(result, f, indent=2)

def fmt_time(s):
    h,m = int(s//3600), int((s%3600)//60)
    sec,ms = int(s%60), int((s%1)*1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"

with open(f"{output_dir}/{base}.srt", "w") as f:
    for i, seg in enumerate(result["segments"], 1):
        f.write(f"{i}\n{fmt_time(seg['start'])} --> {fmt_time(seg['end'])}\n{seg['text'].strip()}\n\n")

print(f"[whisper] Done! Files:")
for fn in sorted(os.listdir(output_dir)):
    size = os.path.getsize(f"{output_dir}/{fn}")
    print(f"  {fn} ({size:,} bytes)")
PYEOF
