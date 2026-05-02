#!/bin/bash
# Bake a new GPU AMI on top of $GPU_AMI with Ollama installed and all 5 bench
# models pre-pulled. Resulting AMI is logged at the end and written into
# config.env as GPU_AMI=<new>.
#
# Runs alongside an in-progress sweep — uses spot to avoid the on-demand
# vCPU bucket the live sweep is using.

set -eu
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

LOG="$SCRIPT_DIR/bake-ollama.log"
> "$LOG"

MODELS=(
  "gemma4:e4b"
  "gemma4:26b"
  "huihui_ai/dolphin3-abliterated:8b"
  "dmtx/qwen3.5-9b-abliterated"
  "huihui_ai/qwen3.5-abliterated:27b"
)

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")

log() { echo "[bake-ollama] $*" | tee -a "$LOG"; }

log "Launching g4dn.xlarge on-demand for bake..."
IID=$(aws ec2 run-instances \
  --image-id "$GPU_AMI" \
  --instance-type g4dn.xlarge \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SECURITY_GROUP" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":150,"DeleteOnTermination":true}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ollama-bake},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=bake}]' \
  --query 'Instances[0].InstanceId' --output text \
  --region "$AWS_REGION" 2>>"$LOG")

log "Bake instance: $IID"
aws ec2 wait instance-running --instance-ids "$IID" --region "$AWS_REGION"
IP=$(aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
log "IP: $IP — waiting for SSH..."

for i in $(seq 1 40); do
  if ssh "${SSH_OPTS[@]}" -o BatchMode=yes ubuntu@"$IP" "echo ok" >/dev/null 2>&1; then break; fi
  sleep 5
done

log "Installing Ollama + pulling all 5 models..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" bash <<'REMOTE' 2>&1 | tee -a "$LOG"
set -e
echo "[bake] Installing Ollama..."
if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
# Wait for service to be ready
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && break || sleep 2
done

echo "[bake] Pulling models..."
for m in gemma4:e4b gemma4:26b huihui_ai/dolphin3-abliterated:8b dmtx/qwen3.5-9b-abliterated huihui_ai/qwen3.5-abliterated:27b; do
  echo "[bake]   pulling $m..."
  ollama pull "$m"
done

echo "[bake] Disk usage of /usr/share/ollama:"
du -sh /usr/share/ollama 2>/dev/null || du -sh ~/.ollama
df -h /

echo "[bake] Flushing filesystem..."
sync; sudo sync; sleep 3; sudo sync
echo "[bake] Done."
REMOTE

log "Snapshotting AMI (with reboot for clean image)..."
NEW_AMI=$(aws ec2 create-image \
  --instance-id "$IID" \
  --name "gpu-runner-ollama-$(date +%Y%m%d-%H%M)" \
  --description "GPU Runner: Whisper + Tesseract + ffmpeg + Ollama (5 models pre-cached)" \
  --query 'ImageId' --output text \
  --region "$AWS_REGION")
log "AMI $NEW_AMI being created..."

for i in $(seq 1 80); do
  STATE=$(aws ec2 describe-images --image-ids "$NEW_AMI" --region "$AWS_REGION" \
    --query 'Images[0].State' --output text 2>/dev/null)
  if [[ "$STATE" == "available" ]]; then break; fi
  log "AMI state: $STATE (attempt $i/80)..."
  sleep 15
done

[[ "$STATE" == "available" ]] || { log "AMI never became available — terminating bake instance and aborting"; \
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>&1; exit 1; }

log "Updating GPU_AMI in config.env..."
sed -i "s/^GPU_AMI=.*/GPU_AMI=$NEW_AMI/" "$SCRIPT_DIR/../config.env"

log "Terminating bake instance..."
aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null
log "DONE. New AMI: $NEW_AMI"
echo "$NEW_AMI" > "$SCRIPT_DIR/.ollama-ami-id"
