#!/bin/bash
# Terminate an EC2 instance
source "$(dirname "$0")/../config.env"

INSTANCE_ID="$1"
if [ -z "$INSTANCE_ID" ]; then
  echo "Usage: terminate.sh <instance-id>" >&2
  exit 1
fi

echo "[terminate] Terminating $INSTANCE_ID..." >&2
aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" > /dev/null
echo "[terminate] Done." >&2
