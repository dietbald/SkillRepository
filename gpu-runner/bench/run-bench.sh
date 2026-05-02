#!/bin/bash
# Whisper benchmark across G-family GPU instances in Sydney.
#
# Usage:
#   bench/run-bench.sh                       # all default types
#   bench/run-bench.sh g4dn.xlarge g6.2xlarge   # specific types
#
# Per instance:
#   1. launch on-demand from $GPU_AMI
#   2. upload bench audio + bench-remote.py
#   3. run remote bench (medium + large), capture JSON
#   4. terminate

set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

AUDIO="$SCRIPT_DIR/../test-files/bench_60s.flac"
RESULTS="$SCRIPT_DIR/results.jsonl"
LOG="$SCRIPT_DIR/run.log"
# Append, don't truncate — supports retrying failed types incrementally
touch "$RESULTS" "$LOG"

[ -f "$AUDIO" ]      || { echo "audio not found: $AUDIO" >&2; exit 1; }
[ -n "${GPU_AMI:-}" ] || { echo "GPU_AMI not set in config.env (run setup-ami first)" >&2; exit 1; }

if [ $# -eq 0 ]; then
  TYPES=(g4dn.xlarge g4dn.2xlarge g5.xlarge g5.2xlarge g6.xlarge g6.2xlarge)
else
  TYPES=("$@")
fi

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")

bench_one() {
  local ITYPE="$1"
  local T_START IID IP T_BOOT T_DONE REMOTE STATUS
  T_START=$(date +%s)
  echo ">>> [$ITYPE] launching..." | tee -a "$LOG"

  # On-demand only — spot pool in Sydney has been unreliable.
  IID=$(aws ec2 run-instances \
    --image-id "$GPU_AMI" \
    --instance-type "$ITYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"DeleteOnTermination":true}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=gpu-bench-$ITYPE},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=bench}]" \
    --query 'Instances[0].InstanceId' --output text \
    --region "$AWS_REGION" 2>>"$LOG")
  [ -z "$IID" ] || [ "$IID" = "None" ] && { echo "    [$ITYPE] launch failed (see $LOG)" | tee -a "$LOG"; return 1; }

  echo "    [$ITYPE] $IID waiting for running..." | tee -a "$LOG"
  aws ec2 wait instance-running --instance-ids "$IID" --region "$AWS_REGION"

  IP=$(aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

  echo "    [$ITYPE] $IID @ $IP — waiting for SSH..." | tee -a "$LOG"
  for i in $(seq 1 40); do
    if ssh "${SSH_OPTS[@]}" -o BatchMode=yes ubuntu@"$IP" "echo ok" >/dev/null 2>&1; then break; fi
    sleep 5
  done
  T_BOOT=$(($(date +%s) - T_START))

  echo "    [$ITYPE] uploading bench files..." | tee -a "$LOG"
  scp "${SSH_OPTS[@]}" "$AUDIO" "$SCRIPT_DIR/bench-remote.py" ubuntu@"$IP":~/ >>"$LOG" 2>&1

  echo "    [$ITYPE] running bench..." | tee -a "$LOG"
  REMOTE=$(ssh "${SSH_OPTS[@]}" ubuntu@"$IP" \
    "python3 ~/bench-remote.py ~/$(basename "$AUDIO")" 2>>"$LOG") \
    && STATUS="ok" || STATUS="failed"

  T_DONE=$(($(date +%s) - T_START))

  echo "    [$ITYPE] terminating..." | tee -a "$LOG"
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>&1 || true
  # Wait for full termination so vCPU quota releases before next launch.
  aws ec2 wait instance-terminated --instance-ids "$IID" --region "$AWS_REGION" 2>/dev/null || true

  # Compose result line — use python for safe JSON merging
  python3 - "$ITYPE" "$IID" "$T_BOOT" "$T_DONE" "$STATUS" "$REMOTE" <<'PY' >> "$RESULTS"
import json, sys
itype, iid, boot, total, status, remote = sys.argv[1:7]
out = {"instance_type": itype, "instance_id": iid,
       "boot_seconds": int(boot), "total_seconds": int(total),
       "status": status}
try:
    out.update(json.loads(remote)) if remote.strip() else None
except Exception as e:
    out["parse_error"] = str(e)
    out["raw_remote"] = remote[-2000:]
print(json.dumps(out))
PY
  echo "    [$ITYPE] done ($status, total=${T_DONE}s)" | tee -a "$LOG"
}

for itype in "${TYPES[@]}"; do
  bench_one "$itype" || true
done

echo
echo "=== Results in $RESULTS ==="
cat "$RESULTS"
