#!/bin/bash
# Task: Run a custom shell command on the GPU instance
# The CUSTOM_CMD env var is set by gpu-task before uploading this script

set -e
echo "[custom] Running: $CUSTOM_CMD"
cd ~/input
eval "$CUSTOM_CMD"
