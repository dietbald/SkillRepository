#!/bin/bash
# Launch an EC2 instance (spot or on-demand) and return its public IP
# Usage: launch.sh [--ondemand]
set -e

source "$(dirname "$0")/../config.env"

USE_ONDEMAND=false
[[ "${1:-}" == "--ondemand" ]] && USE_ONDEMAND=true

# Use GPU AMI if available, otherwise base AMI
AMI="${GPU_AMI:-$BASE_AMI}"

if $USE_ONDEMAND; then
  echo "[launch] Requesting on-demand instance ($INSTANCE_TYPE, AMI: $AMI)..." >&2
  INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=gpu-runner},{Key=ManagedBy,Value=gpu-task}]' \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region "$AWS_REGION")
else
  echo "[launch] Requesting spot instance ($INSTANCE_TYPE, AMI: $AMI)..." >&2
  INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP" \
    --instance-market-options '{
      "MarketType": "spot",
      "SpotOptions": {
        "MaxPrice": "'"$SPOT_MAX_PRICE"'",
        "SpotInstanceType": "one-time"
      }
    }' \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"DeleteOnTermination":true}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=gpu-runner},{Key=ManagedBy,Value=gpu-task}]' \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region "$AWS_REGION")
fi

echo "[launch] Instance $INSTANCE_ID starting..." >&2

# Wait for running state
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text \
  --region "$AWS_REGION")

echo "[launch] Instance running at $PUBLIC_IP" >&2

# Wait for SSH to be ready
echo "[launch] Waiting for SSH..." >&2
for i in $(seq 1 30); do
  if ssh -o StrictHostKeyChecking=no \
         -o ConnectTimeout=5 \
         -o BatchMode=yes \
         -i "$KEY_PATH" \
         ubuntu@"$PUBLIC_IP" "echo ok" >/dev/null 2>&1; then
    echo "[launch] SSH ready." >&2
    break
  fi
  sleep 5
done

# Return instance info as JSON
echo '{"instance_id":"'"$INSTANCE_ID"'","public_ip":"'"$PUBLIC_IP"'"}'
