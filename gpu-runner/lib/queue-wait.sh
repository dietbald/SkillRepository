#!/bin/bash
# Wait for a queued job and download results via SCP
source "$(dirname "$0")/../config.env"
source /tmp/gpu-runner-instance.state 2>/dev/null || { echo "[queue] No warm instance state found"; exit 1; }

JOB_ID="$1"
LOCAL_OUTPUT="${2:-/tmp/gpu-output-$JOB_ID}"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -i $KEY_PATH"

[ -z "$JOB_ID" ] && { echo "Usage: queue-wait.sh <job_id> [output_dir]"; exit 1; }

echo "[queue] Waiting for job $JOB_ID..." >&2
for i in $(seq 1 120); do
  DONE=$(ssh $SSH_OPTS ubuntu@"$PUBLIC_IP" "ls ~/done/${JOB_ID}.done 2>/dev/null" 2>/dev/null || true)
  if [ -n "$DONE" ]; then
    echo "[queue] Job complete. Downloading results..." >&2
    mkdir -p "$LOCAL_OUTPUT"
    scp $SSH_OPTS -r ubuntu@"$PUBLIC_IP":~/output/"$JOB_ID"/. "$LOCAL_OUTPUT/" 2>/dev/null || true
    echo "[queue] Results saved to $LOCAL_OUTPUT" >&2
    ls "$LOCAL_OUTPUT"
    exit 0
  fi
  [ $((i % 6)) -eq 0 ] && echo "[queue] Still processing... (${i}s)" >&2
  sleep 5
done

echo "[queue] Timed out waiting for $JOB_ID" >&2
exit 1
