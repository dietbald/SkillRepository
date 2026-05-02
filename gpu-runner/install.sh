#!/bin/bash
# gpu-runner install script
# Run this on any machine to set up the gpu-task skill
# Usage: bash install.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[gpu-runner] Installing..."

# 1. Copy scripts to ~/gpu-runner
mkdir -p ~/gpu-runner
cp -r "$SCRIPT_DIR"/. ~/gpu-runner/
chmod +x ~/gpu-runner/gpu-task
chmod +x ~/gpu-runner/lib/*.sh
chmod +x ~/gpu-runner/tasks/*.sh
echo "  ✓ Scripts installed to ~/gpu-runner"

# 2. Install skill file
mkdir -p ~/.claude/commands
cp "$SCRIPT_DIR/../.claude/commands/gpu-task.md" ~/.claude/commands/gpu-task.md 2>/dev/null || \
  echo "  ! Skill file not found alongside install.sh — copy gpu-task.md to ~/.claude/commands/ manually"
echo "  ✓ Skill installed to ~/.claude/commands/gpu-task.md"

# 3. SSH key
if [ ! -f ~/.ssh/gpu-runner.pem ]; then
  echo ""
  echo "  ! SSH key missing. Copy gpu-runner.pem to ~/.ssh/gpu-runner.pem then run:"
  echo "      chmod 400 ~/.ssh/gpu-runner.pem"
else
  chmod 400 ~/.ssh/gpu-runner.pem
  echo "  ✓ SSH key found at ~/.ssh/gpu-runner.pem"
fi

# 4. AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
  echo ""
  echo "  ! AWS CLI not configured. Run:"
  echo "      aws configure"
  echo "    Access key : <set in your password manager — see 1Password/pass entry 'aws/gpu-runner'>"
  echo "    Secret key : <set in your password manager>"
  echo "    Region     : ap-southeast-1"
  echo "    Output     : json"
else
  echo "  ✓ AWS CLI already configured"
fi

# 5. Check aws cli installed
if ! command -v aws &>/dev/null; then
  echo ""
  echo "  ! AWS CLI not installed."
  echo "    Mac:   brew install awscli"
  echo "    Linux: sudo apt install awscli"
fi

echo ""
echo "[gpu-runner] Done. Test with:"
echo "  gpu-task status"
echo "  /home/tj/gpu-runner/gpu-task status   # if not in PATH"
