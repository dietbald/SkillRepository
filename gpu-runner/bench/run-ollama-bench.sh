#!/bin/bash
# Ollama benchmark across G-family GPU instances in Sydney.
# Each instance pulls all 5 models in sequence, runs TTFT+decode on each,
# then is terminated.
#
# Usage:
#   bench/run-ollama-bench.sh                      # all default types
#   bench/run-ollama-bench.sh g4dn.2xlarge g5.2xlarge   # specific types

set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

RESULTS="$SCRIPT_DIR/ollama-results.jsonl"
LOG="$SCRIPT_DIR/ollama-run.log"
touch "$RESULTS" "$LOG"

[ -n "${GPU_AMI:-}" ] || { echo "GPU_AMI not set in config.env" >&2; exit 1; }

if [ $# -eq 0 ]; then
  TYPES=(g4dn.xlarge g4dn.2xlarge g5.xlarge g5.2xlarge g6.xlarge g6.2xlarge)
else
  TYPES=("$@")
fi

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")

bench_one() {
  local ITYPE="$1"
  local T_START IID IP T_BOOT T_DONE STATUS
  T_START=$(date +%s)
  echo ">>> [$ITYPE] launching..." | tee -a "$LOG"

  IID=$(aws ec2 run-instances \
    --image-id "$GPU_AMI" \
    --instance-type "$ITYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":150,"DeleteOnTermination":true}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ollama-bench-$ITYPE},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=ollama-bench}]" \
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

  echo "    [$ITYPE] uploading bench-ollama.py..." | tee -a "$LOG"
  scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/bench-ollama.py" ubuntu@"$IP":~/ >>"$LOG" 2>&1

  echo "    [$ITYPE] running ollama bench (this takes 15-30 min, downloads ~50GB of models)..." | tee -a "$LOG"
  # Stream stderr live to log for visibility, capture stdout (JSON).
  REMOTE_OUT=$(ssh "${SSH_OPTS[@]}" ubuntu@"$IP" \
    "python3 ~/bench-ollama.py" 2>>"$LOG") \
    && STATUS="ok" || STATUS="failed"

  T_DONE=$(($(date +%s) - T_START))

  echo "    [$ITYPE] terminating..." | tee -a "$LOG"
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>&1 || true
  aws ec2 wait instance-terminated --instance-ids "$IID" --region "$AWS_REGION" 2>/dev/null || true

  python3 - "$ITYPE" "$IID" "$T_BOOT" "$T_DONE" "$STATUS" "$REMOTE_OUT" <<'PY' >> "$RESULTS"
import json, sys
itype, iid, boot, total, status, raw = sys.argv[1:7]
out = {"instance_type": itype, "instance_id": iid,
       "boot_seconds": int(boot), "total_seconds": int(total),
       "status": status}
# bench-ollama.py prints partial JSON lines + a final full result. Parse final.
final = None
for line in raw.strip().splitlines():
    line = line.strip()
    if not line.startswith("{"): continue
    try:
        obj = json.loads(line)
    except Exception:
        continue
    if obj.get("_partial"): continue
    final = obj
if final:
    out.update(final)
else:
    out["raw_tail"] = raw[-3000:]
print(json.dumps(out))
PY
  echo "    [$ITYPE] done ($status, total=${T_DONE}s)" | tee -a "$LOG"
}

for itype in "${TYPES[@]}"; do
  bench_one "$itype" || true
done

echo
echo "=== Results in $RESULTS ==="
