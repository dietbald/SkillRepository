#!/bin/bash
# One-shot validation of TrevorJS/gemma-4-26B-A4B-it-uncensored-GGUF
# Q4_K_M (16.8 GB). 26B MoE w/ 4B active — should be fast on the A10G.
# Same 5 prompts as the e4b run.
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

REPO="TrevorJS/gemma-4-26B-A4B-it-uncensored-GGUF"
GGUF="gemma-4-26B-A4B-it-uncensored-Q4_K_M.gguf"
GGUF_URL="https://huggingface.co/$REPO/resolve/main/$GGUF"
OLLAMA_TAG="trevor-26b-a4b-q4km"

LOG="$SCRIPT_DIR/trevor-test.log"
OUT="$SCRIPT_DIR/trevor-test-output.txt"
> "$LOG"; > "$OUT"

CANDIDATES=(g6e.2xlarge g6e.xlarge g5.2xlarge g6.2xlarge g5.xlarge g6.xlarge)

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")
log() { echo "[trevor-test] $*" | tee -a "$LOG"; }

IID=""; ITYPE=""
for cand in "${CANDIDATES[@]}"; do
  log "Trying $cand on-demand..."
  IID=$(aws ec2 run-instances \
    --image-id "$GPU_AMI" \
    --instance-type "$cand" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":300,"DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=trevor-test},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=trevor-validation}]' \
    --query 'Instances[0].InstanceId' --output text \
    --region "$AWS_REGION" 2>>"$LOG") || IID=""
  if [ -n "$IID" ] && [ "$IID" != "None" ]; then
    ITYPE="$cand"; log "Launched $IID as $ITYPE"; break
  fi
  IID=""
  log "  $cand failed, trying next..."
done
[ -z "$IID" ] && { log "FATAL: every candidate failed"; exit 1; }

cleanup() {
  log "Terminating $IID..."
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>>"$LOG" || true
  aws ec2 describe-instances --instance-ids "$IID" --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].State.Name' --output text 2>>"$LOG" | tee -a "$LOG" || true
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

log "Setting up Ollama + downloading 16.8GB GGUF (~5-10 min)..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "GGUF_URL='$GGUF_URL' GGUF='$GGUF' OLLAMA_TAG='$OLLAMA_TAG' bash -s" <<'REMOTE' 2>&1 | tee -a "$LOG"
set -e
ROOT_DEV=$(findmnt -no SOURCE /)
ROOT_DISK=$(lsblk -no PKNAME "$ROOT_DEV" | head -1)
PART_NUM=$(echo "$ROOT_DEV" | grep -oE '[0-9]+$')
sudo growpart "/dev/$ROOT_DISK" "$PART_NUM" || echo "[remote] growpart noop"
sudo resize2fs "$ROOT_DEV" || true
df -h /

if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && { echo "[remote] ollama ready"; break; } || sleep 2
done
ollama --version
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

cd ~
if [ ! -f "$GGUF" ]; then
  curl -L --fail --retry 3 -o "$GGUF" "$GGUF_URL"
fi
ls -lh "$GGUF"

cat > Modelfile <<EOF
FROM ./$GGUF
PARAMETER temperature 1.0
PARAMETER top_k 64
PARAMETER top_p 0.95
PARAMETER num_ctx 8192
EOF

echo "[remote] creating ollama model $OLLAMA_TAG ..."
ollama create "$OLLAMA_TAG" -f Modelfile

echo "[remote] warming model (load to GPU)..."
echo "hi" | ollama run --verbose "$OLLAMA_TAG" >/dev/null 2>&1 || echo "[remote] warm warning"

nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader
ollama ps
REMOTE

run_prompt() {
  local label="$1" prompt="$2"
  {
    echo
    echo "--- [$label] ---"
    echo "PROMPT: $prompt"
    echo "RESPONSE:"
  } | tee -a "$OUT"
  ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "ollama run --verbose '$OLLAMA_TAG'" <<<"$prompt" 2>>"$OUT" | tee -a "$OUT"
}

{
  echo "=============================================================================="
  echo " TREVOR 26B-A4B Q4_K_M validation — model=$OLLAMA_TAG  instance=$ITYPE  ip=$IP"
  echo "=============================================================================="
} | tee -a "$OUT"

run_prompt trivia    "What is the capital of Mongolia, and what's one thing it's notable for? One sentence."
run_prompt math      "A train leaves Sydney at 9am at 80 km/h. Another leaves Brisbane (900 km north) at 10am heading south at 100 km/h. When and where do they meet? Show working."
run_prompt code      "Write a concise Python function that returns the Nth Fibonacci number using memoization. One-line docstring."
run_prompt reason    "If all Bloops are Blips, and some Blips are Blops, can we conclude that some Bloops are Blops? Explain in two sentences."
run_prompt write     "Write a 4-line haiku about a thunderstorm at sea."

{ echo; echo "[done] all 5 prompts run."; } | tee -a "$OUT"
log "Eval complete. Output: $OUT"
