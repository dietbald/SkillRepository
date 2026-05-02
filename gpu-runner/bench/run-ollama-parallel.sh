#!/bin/bash
# Run the Ollama bench across multiple instance types IN PARALLEL.
# Designed for the cached-models AMI so per-instance time is ~10 min.
#
# Each "phase" is a set of (instance_type, market) tuples that fit in the
# 8-vCPU OD + 8-vCPU spot quota buckets. Phases run sequentially, but
# all instances within a phase run concurrently.
#
# Usage:
#   bench/run-ollama-parallel.sh
#
# Edit the PHASES array below to change which types run.
#
# Result format: appends to bench/ollama-results.jsonl, same schema as
# run-ollama-bench.sh.

set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

RESULTS="$SCRIPT_DIR/ollama-results.jsonl"
LOG="$SCRIPT_DIR/ollama-parallel.log"
touch "$RESULTS" "$LOG"

[ -n "${GPU_AMI:-}" ] || { echo "GPU_AMI not set in config.env" >&2; exit 1; }

# Each phase is a space-separated list of "instance_type:market" tuples.
# market = ondemand (spot disabled — Sydney pool unreliable)
# Quota: each phase must fit 8 OD vCPU.
PHASES=(
  # One 2xlarge fills the 8-vCPU OD bucket, so they go solo.
  "g4dn.2xlarge:ondemand"
  "g5.2xlarge:ondemand"
  "g6.xlarge:ondemand"
  "g6.2xlarge:ondemand"
)

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")

bench_one() {
  local SPEC="$1"
  local ITYPE="${SPEC%%:*}"
  local MARKET="${SPEC##*:}"
  local TAG="$ITYPE-$MARKET"
  local PER_LOG="$SCRIPT_DIR/ollama-$TAG.log"
  local T_START IID IP T_BOOT T_DONE STATUS REMOTE_OUT
  T_START=$(date +%s)
  echo ">>> [$TAG] launching ($MARKET)..." | tee -a "$LOG" "$PER_LOG"

  local MARKET_OPTS=""
  if [ "$MARKET" = "spot" ]; then
    MARKET_OPTS="--instance-market-options MarketType=spot,SpotOptions={MaxPrice=$SPOT_MAX_PRICE,SpotInstanceType=one-time}"
  fi

  IID=$(aws ec2 run-instances \
    --image-id "$GPU_AMI" \
    --instance-type "$ITYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    $MARKET_OPTS \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":150,"DeleteOnTermination":true}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ollama-bench-$TAG},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=ollama-bench}]" \
    --query 'Instances[0].InstanceId' --output text \
    --region "$AWS_REGION" 2>>"$PER_LOG")

  if [ -z "$IID" ] || [ "$IID" = "None" ]; then
    echo "    [$TAG] launch failed" | tee -a "$LOG" "$PER_LOG"
    return 1
  fi

  echo "    [$TAG] $IID waiting for running..." | tee -a "$LOG" "$PER_LOG"
  aws ec2 wait instance-running --instance-ids "$IID" --region "$AWS_REGION"
  IP=$(aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

  echo "    [$TAG] $IID @ $IP — waiting for SSH..." | tee -a "$LOG" "$PER_LOG"
  for i in $(seq 1 40); do
    if ssh "${SSH_OPTS[@]}" -o BatchMode=yes ubuntu@"$IP" "echo ok" >/dev/null 2>&1; then break; fi
    sleep 5
  done
  T_BOOT=$(($(date +%s) - T_START))

  echo "    [$TAG] uploading bench-ollama.py..." | tee -a "$LOG" "$PER_LOG"
  scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/bench-ollama.py" ubuntu@"$IP":~/ >>"$PER_LOG" 2>&1

  echo "    [$TAG] running bench (cached AMI: ~10 min expected)..." | tee -a "$LOG" "$PER_LOG"
  REMOTE_OUT=$(ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "python3 ~/bench-ollama.py" 2>>"$PER_LOG") \
    && STATUS="ok" || STATUS="failed"

  T_DONE=$(($(date +%s) - T_START))

  echo "    [$TAG] terminating..." | tee -a "$LOG" "$PER_LOG"
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>&1 || true
  aws ec2 wait instance-terminated --instance-ids "$IID" --region "$AWS_REGION" 2>/dev/null || true

  python3 - "$ITYPE" "$IID" "$T_BOOT" "$T_DONE" "$STATUS" "$REMOTE_OUT" "$MARKET" <<'PY' >> "$RESULTS"
import json, sys
itype, iid, boot, total, status, raw, market = sys.argv[1:8]
out = {"instance_type": itype, "instance_id": iid, "market": market,
       "boot_seconds": int(boot), "total_seconds": int(total),
       "status": status}
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
  echo "    [$TAG] done ($status, total=${T_DONE}s)" | tee -a "$LOG" "$PER_LOG"
}

for PHASE in "${PHASES[@]}"; do
  echo "====== PHASE: $PHASE ======" | tee -a "$LOG"
  PIDS=()
  for SPEC in $PHASE; do
    bench_one "$SPEC" &
    PIDS+=($!)
  done
  echo "  Waiting for ${#PIDS[@]} parallel instances to finish..." | tee -a "$LOG"
  for pid in "${PIDS[@]}"; do
    wait "$pid" || true
  done
  echo "====== PHASE complete ======" | tee -a "$LOG"
done

echo
echo "=== Results in $RESULTS ==="
