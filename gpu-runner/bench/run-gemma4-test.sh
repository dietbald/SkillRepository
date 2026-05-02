#!/bin/bash
# One-shot validation: launch highest-OD GPU instance, pull gemma4:e4b
# (the ~8B-raw / 4.5B-effective Gemma 4 edge model), run 5 prompts via the
# `ollama run` CLI (avoids the /api/chat 500 seen on abliterated builds),
# print results, terminate. Always terminates, even on error.
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../config.env"

MODEL="${EVAL_MODEL:-gemma4:e4b}"
LOG="$SCRIPT_DIR/gemma4-test.log"
OUT="$SCRIPT_DIR/gemma4-test-output.txt"
> "$LOG"; > "$OUT"

# Ranked list of "highest available" single-GPU on-demand types.
# We try in order; first one whose RunInstances succeeds wins.
CANDIDATES=(g6e.2xlarge g6e.xlarge g5.2xlarge g5.xlarge g6.2xlarge g6.xlarge g4dn.2xlarge g4dn.xlarge)

SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "$KEY_PATH")
log() { echo "[gemma4-test] $*" | tee -a "$LOG"; }

IID=""
ITYPE=""
for cand in "${CANDIDATES[@]}"; do
  log "Trying $cand on-demand..."
  IID=$(aws ec2 run-instances \
    --image-id "$GPU_AMI" \
    --instance-type "$cand" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":150,"DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=gemma4-test},{Key=ManagedBy,Value=gpu-task},{Key=Purpose,Value=gemma4-validation}]' \
    --query 'Instances[0].InstanceId' --output text \
    --region "$AWS_REGION" 2>>"$LOG") || IID=""
  if [ -n "$IID" ] && [ "$IID" != "None" ]; then
    ITYPE="$cand"
    log "Launched $IID as $ITYPE"
    break
  fi
  IID=""
  log "  $cand failed (quota/availability), trying next..."
done

[ -z "$IID" ] && { log "FATAL: every candidate instance type failed"; exit 1; }

# Always terminate, even if anything below errors out.
cleanup() {
  log "Terminating $IID..."
  aws ec2 terminate-instances --instance-ids "$IID" --region "$AWS_REGION" >/dev/null 2>>"$LOG" || true
  log "Terminate requested. Final state below:"
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

log "Confirming Ollama is installed and running..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" bash <<'REMOTE' 2>&1 | tee -a "$LOG"
set -e
if ! command -v ollama >/dev/null 2>&1; then
  echo "[remote] installing ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && { echo "[remote] ollama ready"; break; } || sleep 2
done
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || true
REMOTE

log "Pulling $MODEL (cached if AMI was baked with it)..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "ollama list | awk '{print \$1}' | grep -qx '$MODEL' || ollama pull '$MODEL'" 2>&1 | tee -a "$LOG"

log "Warming model..."
ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "echo 'hi' | ollama run --verbose '$MODEL' >/dev/null" 2>&1 | tee -a "$LOG"

run_prompt() {
  local label="$1" prompt="$2"
  {
    echo
    echo "--- [$label] ---"
    echo "PROMPT: $prompt"
    echo "RESPONSE:"
  } | tee -a "$OUT"
  ssh "${SSH_OPTS[@]}" ubuntu@"$IP" "ollama run --verbose '$MODEL'" <<<"$prompt" 2>>"$OUT" | tee -a "$OUT"
}

{
  echo "=============================================================================="
  echo " gemma4 8B-class validation — model=$MODEL  instance=$ITYPE  ip=$IP"
  echo "=============================================================================="
} | tee -a "$OUT"

run_prompt trivia    "What is the capital of Mongolia, and what's one thing it's notable for? One sentence."
run_prompt math      "A train leaves Sydney at 9am at 80 km/h. Another leaves Brisbane (900 km north) at 10am heading south at 100 km/h. When and where do they meet? Show working."
run_prompt code      "Write a concise Python function that returns the Nth Fibonacci number using memoization. One-line docstring."
run_prompt reason    "If all Bloops are Blips, and some Blips are Blops, can we conclude that some Bloops are Blops? Explain in two sentences."
run_prompt write     "Write a 4-line haiku about a thunderstorm at sea."

{
  echo
  echo "[done] all 5 prompts run."
} | tee -a "$OUT"

log "Eval complete. Output: $OUT"
