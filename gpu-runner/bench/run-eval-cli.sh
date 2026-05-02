#!/bin/bash
# Launch g5.xlarge OD, run eval-cli.sh against the abliterated model, terminate.
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

ITYPE="${1:-g5.xlarge}"
MODEL="${EVAL_MODEL:-huihui_ai/dolphin3-abliterated:8b}"
LOG="$SCRIPT_DIR/eval-cli.log"
OUT="$SCRIPT_DIR/eval-output.txt"
> "$LOG"; > "$OUT"

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")

log() { echo "[eval] $*" | tee -a "$LOG"; }

log "Launching $ITYPE on-demand..."
IID=$(aws ec2 run-instances \
  --image-id "$GPU_AMI" \
  --instance-type "$ITYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SECURITY_GROUP" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":150,"DeleteOnTermination":true}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ollama-eval-cli},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=eval}]' \
  --query 'Instances[0].InstanceId' --output text \
  --region "$AWS_REGION" 2>>"$LOG")
[ -z "$IID" ] || [ "$IID" = "None" ] && { log "launch failed"; exit 1; }
log "Instance: $IID"

aws ec2 wait instance-running --instance-ids "$IID" --region "$AWS_REGION"
IP=$(aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
log "IP: $IP"

for i in $(seq 1 40); do
  ssh "${SSH_OPTS[@]}" -o BatchMode=yes ubuntu@"$IP" "echo ok" >/dev/null 2>&1 && break
  sleep 5
done

log "Confirming model present (cached) and pulling if not..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "ollama list | grep -q '^$MODEL ' || ollama pull '$MODEL'" 2>>"$LOG"

log "Running CLI eval against $MODEL..."
EVAL_MODEL="$MODEL" KEY_PATH="$KEY_PATH" bash "$SCRIPT_DIR/eval-cli.sh" "$IP" "$OUT"

log "Terminating $IID..."
aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null
log "Done."
