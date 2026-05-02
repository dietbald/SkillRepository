#!/bin/bash
# Upload input files, run a script on the remote instance, download outputs
source "$(dirname "$0")/../config.env"

PUBLIC_IP="$1"
REMOTE_SCRIPT="$2"  # script to run on remote
INPUT_FILES="$3"    # space-separated local paths to upload
OUTPUT_DIR="$4"     # local dir to download results into

SSH="ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -i $KEY_PATH ubuntu@$PUBLIC_IP"
SCP="scp -o StrictHostKeyChecking=no -i $KEY_PATH"

# Upload input files
if [ -n "$INPUT_FILES" ]; then
  echo "[transfer] Uploading input files..." >&2
  for f in $INPUT_FILES; do
    echo "[transfer]   $f" >&2
    $SCP "$f" ubuntu@"$PUBLIC_IP":~/input/ 2>/dev/null || \
      ($SSH "mkdir -p ~/input" && $SCP "$f" ubuntu@"$PUBLIC_IP":~/input/)
  done
fi

# Upload and run the task script
echo "[run] Executing task on remote..." >&2
$SCP "$REMOTE_SCRIPT" ubuntu@"$PUBLIC_IP":~/task.sh
$SSH "chmod +x ~/task.sh && mkdir -p ~/input ~/output && ~/task.sh"

# Download output files
if [ -n "$OUTPUT_DIR" ]; then
  echo "[transfer] Downloading results..." >&2
  mkdir -p "$OUTPUT_DIR"
  $SCP -r ubuntu@"$PUBLIC_IP":~/output/. "$OUTPUT_DIR/"
  echo "[transfer] Results saved to $OUTPUT_DIR" >&2
fi
