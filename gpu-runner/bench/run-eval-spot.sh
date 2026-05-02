#!/bin/bash
# Launch g5.xlarge spot, pull abliterated 26B Gemma 4, run eval, terminate.
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

ITYPE="${1:-g5.xlarge}"
LOG="$SCRIPT_DIR/eval-spot.log"
OUT="$SCRIPT_DIR/eval-output.txt"
> "$LOG"; > "$OUT"

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")

log() { echo "[eval] $*" | tee -a "$LOG"; }

log "Launching $ITYPE on-demand from cached AMI ($GPU_AMI)..."
IID=$(aws ec2 run-instances \
  --image-id "$GPU_AMI" \
  --instance-type "$ITYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SECURITY_GROUP" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":150,"DeleteOnTermination":true}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ollama-eval-abliterated},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=eval}]' \
  --query 'Instances[0].InstanceId' --output text \
  --region "$AWS_REGION" 2>>"$LOG")
[ -z "$IID" ] || [ "$IID" = "None" ] && { log "launch failed"; exit 1; }
log "Instance: $IID"

aws ec2 wait instance-running --instance-ids "$IID" --region "$AWS_REGION"
IP=$(aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
log "IP: $IP — waiting for SSH..."
for i in $(seq 1 40); do
  if ssh "${SSH_OPTS[@]}" -o BatchMode=yes ubuntu@"$IP" "echo ok" >/dev/null 2>&1; then break; fi
  sleep 5
done

log "Uploading eval-abliterated.py..."
scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/eval-abliterated.py" ubuntu@"$IP":~/ >>"$LOG" 2>&1

log "Running eval (will take ~10-15 min: model pull + 16 prompts)..."
# Stream stdout to OUT so we can watch live
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "python3 ~/eval-abliterated.py" 2>>"$LOG" | tee -a "$OUT"

log "Downloading structured JSON results..."
scp "${SSH_OPTS[@]}" ubuntu@"$IP":~/eval-results.json "$SCRIPT_DIR/eval-results.json" 2>>"$LOG" || log "(no JSON file)"

log "Terminating $IID..."
aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null
log "Done. Output: $OUT"
