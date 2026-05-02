#!/bin/bash
# Bake a LEAN AMI from BASE_AMI (plain DLAMI — just NVIDIA drivers + CUDA, no
# Whisper/torch/ffmpeg/tesseract bloat) with ollama + trevor model preloaded.
# Target final image size: ~50 GB. Volume size: 100 GB (peak during bake ~85 GB).
# Writes CHAT_AMI=ami-xxx into config.env on success.
set -eu
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

REPO="TrevorJS/gemma-4-26B-A4B-it-uncensored-GGUF"
GGUF="gemma-4-26B-A4B-it-uncensored-Q4_K_M.gguf"
GGUF_URL="https://huggingface.co/$REPO/resolve/main/$GGUF"
OLLAMA_TAG="trevor-26b-a4b-q4km"

LOG="$SCRIPT_DIR/bake-freemodel.log"
> "$LOG"

CANDIDATES=(g6e.2xlarge g6e.xlarge g5.2xlarge g6.2xlarge g5.xlarge g6.xlarge)
SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")
log() { echo "[bake-lean] $*" | tee -a "$LOG"; }

IID=""; ITYPE=""
for cand in "${CANDIDATES[@]}"; do
  log "Trying $cand on-demand..."
  IID=$(aws ec2 run-instances \
    --image-id "$BASE_AMI" \
    --instance-type "$cand" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=freemodel-bake-lean},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=freemodel-bake-lean}]' \
    --query 'Instances[0].InstanceId' --output text \
    --region "$AWS_REGION" 2>>"$LOG") || IID=""
  if [ -n "$IID" ] && [ "$IID" != "None" ]; then
    ITYPE="$cand"; log "Bake instance: $IID ($ITYPE)"; break
  fi
  IID=""; log "  $cand failed, trying next..."
done
[ -z "$IID" ] && { log "FATAL: every candidate failed"; exit 1; }

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

log "Installing Ollama, downloading GGUF, creating model on plain DLAMI..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "GGUF_URL='$GGUF_URL' GGUF='$GGUF' OLLAMA_TAG='$OLLAMA_TAG' bash -s" <<'REMOTE' 2>&1 | tee -a "$LOG"
set -e
echo "[bake] starting baseline disk:"
df -h /
echo "[bake] gpu check:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# Install ollama (and only ollama; no whisper/torch/ffmpeg/tesseract)
echo "[bake] installing ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Make sure the systemd service is enabled and running. The install.sh script
# usually does this, but on the bare DLAMI base it sometimes doesn't — and a
# non-running ollama silently makes `ollama create` fail without halting bake.
sudo systemctl enable ollama || true
sudo systemctl start ollama  || true

OLLAMA_READY=false
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    OLLAMA_READY=true
    echo "[bake] ollama ready after ${i}×2s"
    break
  fi
  sleep 2
done
if ! $OLLAMA_READY; then
  echo "[bake] FATAL: ollama API never came up — aborting bake"
  sudo systemctl status ollama --no-pager || true
  sudo journalctl -u ollama --no-pager -n 50 || true
  exit 1
fi
ollama --version

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

# Verify the model actually exists in ollama before we delete the source GGUF
ollama list | awk '{print $1}' | grep -qx "$OLLAMA_TAG:latest" || ollama list | awk '{print $1}' | grep -qx "$OLLAMA_TAG" || {
  echo "[bake] FATAL: ollama create reported success but $OLLAMA_TAG isn't in 'ollama list' — aborting"
  ollama list
  exit 1
}

echo "[bake] removing source GGUF (model is now in ollama blob store)..."
rm -f "$GGUF" Modelfile

echo "[bake] verifying load to GPU..."
echo "hello" | ollama run --verbose "$OLLAMA_TAG" >/dev/null 2>&1 || true
ollama list
nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader

# Final guard: model files must actually exist on the blob store, otherwise
# the snapshot will produce a useless AMI like the first lean one did.
BLOB_DIR=/usr/share/ollama/.ollama/models/blobs
sudo test -d "$BLOB_DIR" && BLOB_BYTES=$(sudo du -sb "$BLOB_DIR" | awk '{print $1}') || BLOB_BYTES=0
if [ "$BLOB_BYTES" -lt 16000000000 ]; then
  echo "[bake] FATAL: $BLOB_DIR is only ${BLOB_BYTES} bytes — model didn't land on disk. Aborting."
  exit 1
fi
echo "[bake] blob store size OK: $((BLOB_BYTES / 1024 / 1024 / 1024)) GB"

echo "[bake] aggressive cleanup to slim the image..."
sudo apt-get clean -y || true
sudo rm -rf /var/cache/apt/archives/*.deb /var/lib/apt/lists/* /tmp/* /var/tmp/*
rm -rf ~/.cache/pip ~/.npm ~/.cache/* 2>/dev/null || true
# Trim filesystem so unused blocks don't end up in the snapshot
sudo fstrim -av || true

echo "[bake] flushing fs before snapshot..."
sync; sudo sync; sleep 3; sudo sync

df -h /
echo "[bake] done preparing image"
REMOTE

log "Snapshotting AMI (instance reboots for clean image)..."
NEW_AMI=$(aws ec2 create-image \
  --instance-id "$IID" \
  --name "freemodel-lean-trevor-26b-a4b-$(date +%Y%m%d-%H%M)" \
  --description "Lean: DLAMI base + ollama + TrevorJS gemma-4-26B-A4B-it-uncensored Q4_K_M as $OLLAMA_TAG" \
  --query 'ImageId' --output text \
  --region "$AWS_REGION")
log "AMI $NEW_AMI being created..."

for i in $(seq 1 160); do
  STATE=$(aws ec2 describe-images --image-ids "$NEW_AMI" --region "$AWS_REGION" \
    --query 'Images[0].State' --output text 2>/dev/null)
  [[ "$STATE" == "available" ]] && break
  log "AMI state: $STATE (attempt $i/160)..."
  sleep 30
done
[[ "$STATE" == "available" ]] || { log "FATAL: AMI never became available after 80min"; exit 1; }

log "Updating CHAT_AMI in config.env (was: $CHAT_AMI)..."
if grep -q "^CHAT_AMI=" "$SCRIPT_DIR/../config.env"; then
  sed -i "s|^CHAT_AMI=.*|CHAT_AMI=$NEW_AMI|" "$SCRIPT_DIR/../config.env"
else
  echo "CHAT_AMI=$NEW_AMI" >> "$SCRIPT_DIR/../config.env"
fi

log "DONE. New CHAT_AMI: $NEW_AMI"
echo "$NEW_AMI" > "$SCRIPT_DIR/.freemodel-ami-id"
log "Old AMI ami-08fea6b9de008ea9e is no longer referenced. Deregister it manually with:"
log "  aws ec2 deregister-image --image-id ami-08fea6b9de008ea9e --region ap-southeast-2"
log "  aws ec2 delete-snapshot --snapshot-id <snap-id-from-old-ami> --region ap-southeast-2"
