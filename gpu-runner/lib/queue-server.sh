#!/bin/bash
# Queue server — runs ON the remote instance via tmux
# Auto-terminates after IDLE_TIMEOUT seconds of no new jobs

IDLE_TIMEOUT=300
export PATH="$PATH:/home/ubuntu/.local/bin"

mkdir -p ~/queue ~/done ~/output

echo "[queue-server] Started at $(date). Idle timeout: ${IDLE_TIMEOUT}s"
LAST_JOB=$(date +%s)

process_job() {
  local JOB="$1"
  local JOB_ID=$(basename "$JOB" .job)
  echo "[queue-server] Processing: $JOB_ID at $(date)"

  source "$JOB"
  mkdir -p "$OUTPUT_DIR"

  case "$TASK_TYPE" in
    tesseract)
      for INPUT_FILE in "$INPUT_DIR"/*; do
        [ -f "$INPUT_FILE" ] || continue
        EXT=$(echo "${INPUT_FILE##*.}" | tr '[:upper:]' '[:lower:]')
        [[ ! "$EXT" =~ ^(pdf|png|jpg|jpeg|tiff|tif|bmp|ppm)$ ]] && continue
        BASE=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')
        echo "[tesseract] Processing: $(basename $INPUT_FILE)"
        if [[ "$EXT" == "pdf" ]]; then
          mkdir -p /tmp/pages_$$
          pdftoppm -r 300 "$INPUT_FILE" /tmp/pages_$$/page 2>/dev/null
          for IMG in /tmp/pages_$$/page-*.ppm; do
            PAGE=$(basename "$IMG" .ppm | sed 's/page-//')
            tesseract "$IMG" "$OUTPUT_DIR/${BASE}_p${PAGE}" txt 2>/dev/null
          done
          cat "$OUTPUT_DIR/${BASE}"_p*.txt > "$OUTPUT_DIR/${BASE}_full.txt" 2>/dev/null
          rm -rf /tmp/pages_$$
        else
          tesseract "$INPUT_FILE" "$OUTPUT_DIR/$BASE" txt 2>/dev/null
        fi
        echo "[tesseract] Done: ${BASE}.txt"
      done
      ;;

    whisper)
      python3 - <<PYEOF
import whisper, json, os, sys
model = whisper.load_model('${MODEL:-medium}')
input_dir  = '$INPUT_DIR'
output_dir = '$OUTPUT_DIR'
for fn in sorted(os.listdir(input_dir)):
    if not fn.lower().endswith(('.mp3','.mp4','.wav','.m4a','.ogg')): continue
    path = f'{input_dir}/{fn}'
    base = os.path.splitext(fn)[0]
    print(f'[whisper] Transcribing: {fn}')
    result = model.transcribe(path, language='${LANGUAGE}' or None, verbose=False)
    with open(f'{output_dir}/{base}.txt','w') as f: f.write(result['text'].strip())
    with open(f'{output_dir}/{base}.json','w') as f: json.dump(result,f,indent=2)
    def ft(s):
        h,m=int(s//3600),int((s%3600)//60); sec,ms=int(s%60),int((s%1)*1000)
        return f'{h:02}:{m:02}:{sec:02},{ms:03}'
    with open(f'{output_dir}/{base}.srt','w') as f:
        for i,seg in enumerate(result['segments'],1):
            f.write(f"{i}\n{ft(seg['start'])} --> {ft(seg['end'])}\n{seg['text'].strip()}\n\n")
    print(f'[whisper] Done: {base}')
PYEOF
      ;;

    ffmpeg)
      for INPUT_FILE in "$INPUT_DIR"/*; do
        [ -f "$INPUT_FILE" ] || continue
        BASE=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')
        EXT=$(echo "${INPUT_FILE##*.}" | tr '[:upper:]' '[:lower:]')
        echo "[ffmpeg] Processing: $(basename $INPUT_FILE)"
        if [[ "$EXT" =~ ^(mp4|mkv|avi|mov|webm)$ ]]; then
          ffmpeg -i "$INPUT_FILE" -q:a 0 -map a "$OUTPUT_DIR/${BASE}.mp3" -y </dev/null 2>/dev/null
        elif [[ "$EXT" =~ ^(mp3|wav|m4a|aac|ogg|flac)$ ]]; then
          ffmpeg -i "$INPUT_FILE" -q:a 2 "$OUTPUT_DIR/${BASE}.mp3" -y </dev/null 2>/dev/null
          ffmpeg -i "$INPUT_FILE" -ar 16000 -ac 1 "$OUTPUT_DIR/${BASE}_16k_mono.wav" -y </dev/null 2>/dev/null
        fi
        echo "[ffmpeg] Done: $BASE"
      done
      ;;
  esac

  mv "$JOB" ~/done/"${JOB_ID}.done"
  echo "[queue-server] Job $JOB_ID complete at $(date)."
}

while true; do
  # Process all pending jobs
  for JOB in ~/queue/*.job; do
    [ -f "$JOB" ] || continue
    process_job "$JOB"
    LAST_JOB=$(date +%s)
  done

  # Check idle timeout
  NOW=$(date +%s)
  IDLE=$((NOW - LAST_JOB))

  if [ $IDLE -ge $IDLE_TIMEOUT ]; then
    echo "[queue-server] Idle for ${IDLE}s — shutting down instance at $(date)."
    sudo shutdown -h now
    exit 0
  fi

  # Print idle status every 60s
  if [ $((IDLE % 60)) -lt 3 ] && [ $IDLE -gt 5 ]; then
    echo "[queue-server] Idle ${IDLE}s / ${IDLE_TIMEOUT}s"
  fi

  sleep 3
done
