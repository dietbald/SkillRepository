#!/bin/bash
# Bake an AMI with TrevorJS gemma-4-26B-A4B Q4_K_M pre-loaded into ollama.
# Result: cold-start drops from ~10 min (download + create) to ~90s (boot + GPU load).
# On success, writes CHAT_AMI=ami-xxx into config.env via sed.
set -eu
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

REPO="TrevorJS/gemma-4-26B-A4B-it-uncensored-GGUF"
GGUF="gemma-4-26B-A4B-it-uncensored-Q4_K_M.gguf"
GGUF_URL="https://huggingface.co/$REPO/resolve/main/$GGUF"
OLLAMA_TAG="trevor-26b-a4b-q4km"

LOG="$SCRIPT_DIR/bake-trevor.log"
> "$LOG"

CANDIDATES=(g6e.2xlarge g6e.xlarge g5.2xlarge g6.2xlarge g5.xlarge g6.xlarge)
SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")
log() { echo "[bake-trevor] $*" | tee -a "$LOG"; }

IID=""; ITYPE=""
for cand in "${CANDIDATES[@]}"; do
  log "Trying $cand on-demand for bake..."
  IID=$(aws ec2 run-instances \
    --image-id "$GPU_AMI" \
    --instance-type "$cand" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":300,"DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=trevor-ami-bake},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=trevor-bake}]' \
    --query 'Instances[0].InstanceId' --output text \
    --region "$AWS_REGION" 2>>"$LOG") || IID=""
  if [ -n "$IID" ] && [ "$IID" != "None" ]; then
    ITYPE="$cand"; log "Bake instance: $IID ($ITYPE)"; break
  fi
  IID=""; log "  $cand failed, trying next..."
done
[ -z "$IID" ] && { log "FATAL: every candidate failed"; exit 1; }

# Always terminate the bake instance, even on failure.
cleanup() {
  log "Terminating bake instance $IID..."
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>>"$LOG" || true
}
trap cleanup EXIT

aws ec2 wait instance-running --instance-ids "$IID" --region "$AWS_REGION"
IP=$(aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
log "IP: $IP — waiting for SSH..."
for i in $(seq 1 60); do
  ssh "${SSH_OPTS[@]}" -o BatchMode=yes ubuntu@"$IP" "echo ok" >/dev/null 2>&1 && { log "SSH up"; break; }
  sleep 5
done

log "Installing Ollama, downloading GGUF, creating model..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "GGUF_URL='$GGUF_URL' GGUF='$GGUF' OLLAMA_TAG='$OLLAMA_TAG' bash -s" <<'REMOTE' 2>&1 | tee -a "$LOG"
set -e
ROOT_DEV=$(findmnt -no SOURCE /)
ROOT_DISK=$(lsblk -no PKNAME "$ROOT_DEV" | head -1)
PART_NUM=$(echo "$ROOT_DEV" | grep -oE '[0-9]+$')
sudo growpart "/dev/$ROOT_DISK" "$PART_NUM" || echo "[bake] growpart noop"
sudo resize2fs "$ROOT_DEV" || true
df -h /

if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && { echo "[bake] ollama ready"; break; } || sleep 2
done
ollama --version

# Drop the 5 prior models that were baked into the source AMI to keep
# the new AMI lean — we only want trevor on this image.
echo "[bake] removing prior baked models..."
sudo systemctl stop ollama 2>/dev/null || true
sudo rm -rf /usr/share/ollama/.ollama/models /root/.ollama/models ~/.ollama/models
sudo systemctl start ollama 2>/dev/null || true
sleep 3
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && { echo "[bake] ollama back up"; break; } || sleep 2
done

cd ~
echo "[bake] downloading $GGUF (16.8 GB)..."
curl -L --fail --retry 3 -o "$GGUF" "$GGUF_URL"
ls -lh "$GGUF"

cat > Modelfile <<EOF
FROM ./$GGUF
PARAMETER temperature 1.0
PARAMETER top_k 64
PARAMETER top_p 0.95
PARAMETER num_ctx 8192
EOF

echo "[bake] creating ollama model $OLLAMA_TAG ..."
ollama create "$OLLAMA_TAG" -f Modelfile

echo "[bake] removing source GGUF (model is now in ollama blob store)..."
rm -f "$GGUF" Modelfile

echo "[bake] verifying load to GPU..."
echo "hello" | ollama run --verbose "$OLLAMA_TAG" >/dev/null 2>&1 || true
ollama list
nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader

echo "[bake] flushing fs before snapshot..."
sync; sudo sync; sleep 3; sudo sync

df -h /
echo "[bake] done preparing image"
REMOTE

log "Snapshotting AMI (instance reboots for clean image)..."
NEW_AMI=$(aws ec2 create-image \
  --instance-id "$IID" \
  --name "gpu-runner-trevor-26b-a4b-$(date +%Y%m%d-%H%M)" \
  --description "GPU Runner: ollama + TrevorJS gemma-4-26B-A4B-it-uncensored Q4_K_M pre-loaded as $OLLAMA_TAG" \
  --query 'ImageId' --output text \
  --region "$AWS_REGION")
log "AMI $NEW_AMI being created..."

for i in $(seq 1 80); do
  STATE=$(aws ec2 describe-images --image-ids "$NEW_AMI" --region "$AWS_REGION" \
    --query 'Images[0].State' --output text 2>/dev/null)
  [[ "$STATE" == "available" ]] && break
  log "AMI state: $STATE (attempt $i/80)..."
  sleep 15
done
[[ "$STATE" == "available" ]] || { log "FATAL: AMI never became available"; exit 1; }

log "Updating CHAT_AMI in config.env..."
if grep -q "^CHAT_AMI=" "$SCRIPT_DIR/../config.env"; then
  sed -i "s|^CHAT_AMI=.*|CHAT_AMI=$NEW_AMI|" "$SCRIPT_DIR/../config.env"
else
  echo "CHAT_AMI=$NEW_AMI" >> "$SCRIPT_DIR/../config.env"
fi

log "DONE. New CHAT_AMI: $NEW_AMI"
echo "$NEW_AMI" > "$SCRIPT_DIR/.trevor-ami-id"
