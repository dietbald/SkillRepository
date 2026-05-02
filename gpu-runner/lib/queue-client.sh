#!/bin/bash
# Queue client — submits a job to the warm instance via SCP
# Usage: queue-client.sh <task_type> <input_file> [--model x] [--language x] [--output /path]

set -e
source "$(dirname "$0")/../config.env"
source /tmp/gpu-runner-instance.state

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -i $KEY_PATH"

TASK_TYPE="$1"; shift
INPUT_FILE=""
MODEL="medium"
LANGUAGE=""
LOCAL_OUTPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)    MODEL="$2";        shift 2 ;;
    --language) LANGUAGE="$2";     shift 2 ;;
    --output)   LOCAL_OUTPUT="$2"; shift 2 ;;
    *)          [ -f "$1" ] && INPUT_FILE="$1"; shift ;;
  esac
done

JOB_ID="job-$(date +%s%N | md5sum | head -c8)"
JOB_INPUT_DIR="$HOME/input_$JOB_ID"

# Upload input file directly via SCP
echo "[queue] Submitting $TASK_TYPE job: $JOB_ID" >&2
ssh $SSH_OPTS ubuntu@"$PUBLIC_IP" "mkdir -p ~/input_$JOB_ID ~/output/$JOB_ID ~/queue ~/done"
[ -n "$INPUT_FILE" ] && scp $SSH_OPTS "$INPUT_FILE" ubuntu@"$PUBLIC_IP":~/input_$JOB_ID/

# Write job spec directly on remote
ssh $SSH_OPTS ubuntu@"$PUBLIC_IP" "cat > ~/queue/${JOB_ID}.job" <<EOF
TASK_TYPE=$TASK_TYPE
MODEL=$MODEL
LANGUAGE=$LANGUAGE
INPUT_DIR=\$HOME/input_$JOB_ID
OUTPUT_DIR=\$HOME/output/$JOB_ID
EOF

echo "[queue] Job queued: $JOB_ID" >&2
echo "$JOB_ID"
