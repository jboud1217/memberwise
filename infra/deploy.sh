#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────
APP_NAME="memberwise"
REGION="us-east-1"
ACCOUNT_ID="438027399794"
VPC_ID="vpc-06784ff32861a0045"
SUBNET_1="subnet-0f52105f41cfe06e5"
SUBNET_2="subnet-0905d971709d6c367"
DOMAIN="memberwise.buckheadwebservices.com"
ECR_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${APP_NAME}"
DB_NAME="memberwise"
DB_USER="memberwise"
DB_PASS="$(openssl rand -hex 16)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Step 1: ECR Repository ─────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 1: ECR Repository"
echo "═══════════════════════════════════════════════"

if aws ecr describe-repositories --repository-names "$APP_NAME" --region "$REGION" >/dev/null 2>&1; then
  log "ECR repository already exists"
else
  aws ecr create-repository --repository-name "$APP_NAME" --region "$REGION" --image-scanning-configuration scanOnPush=true >/dev/null
  log "Created ECR repository: $APP_NAME"
fi

# ─── Step 2: Build & Push Docker Image ──────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 2: Build & Push Docker Image"
echo "═══════════════════════════════════════════════"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
log "Logged in to ECR"

IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')"
FULL_IMAGE="${ECR_REPO}:${IMAGE_TAG}"

echo "Building image: $FULL_IMAGE"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker build --platform linux/amd64 -t "$FULL_IMAGE" -t "${ECR_REPO}:latest" -f "$REPO_ROOT/Dockerfile" "$REPO_ROOT"
log "Docker image built"

docker push "$FULL_IMAGE"
docker push "${ECR_REPO}:latest"
log "Docker image pushed to ECR"

# ─── Step 3: Security Groups ────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 3: Security Groups"
echo "═══════════════════════════════════════════════"

# ALB security group
ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${APP_NAME}-alb-sg" "Name=vpc-id,Values=${VPC_ID}" --query "SecurityGroups[0].GroupId" --output text --region "$REGION" 2>/dev/null)
if [ "$ALB_SG_ID" = "None" ] || [ -z "$ALB_SG_ID" ]; then
  ALB_SG_ID=$(aws ec2 create-security-group --group-name "${APP_NAME}-alb-sg" --description "ALB security group for ${APP_NAME}" --vpc-id "$VPC_ID" --region "$REGION" --output text --query "GroupId")
  aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION" >/dev/null
  aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION" >/dev/null
  log "Created ALB security group: $ALB_SG_ID"
else
  log "ALB security group exists: $ALB_SG_ID"
fi

# ECS security group
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${APP_NAME}-ecs-sg" "Name=vpc-id,Values=${VPC_ID}" --query "SecurityGroups[0].GroupId" --output text --region "$REGION" 2>/dev/null)
if [ "$ECS_SG_ID" = "None" ] || [ -z "$ECS_SG_ID" ]; then
  ECS_SG_ID=$(aws ec2 create-security-group --group-name "${APP_NAME}-ecs-sg" --description "ECS security group for ${APP_NAME}" --vpc-id "$VPC_ID" --region "$REGION" --output text --query "GroupId")
  aws ec2 authorize-security-group-ingress --group-id "$ECS_SG_ID" --protocol tcp --port 3000 --source-group "$ALB_SG_ID" --region "$REGION" >/dev/null
  log "Created ECS security group: $ECS_SG_ID"
else
  log "ECS security group exists: $ECS_SG_ID"
fi

# RDS security group
RDS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${APP_NAME}-rds-sg" "Name=vpc-id,Values=${VPC_ID}" --query "SecurityGroups[0].GroupId" --output text --region "$REGION" 2>/dev/null)
if [ "$RDS_SG_ID" = "None" ] || [ -z "$RDS_SG_ID" ]; then
  RDS_SG_ID=$(aws ec2 create-security-group --group-name "${APP_NAME}-rds-sg" --description "RDS security group for ${APP_NAME}" --vpc-id "$VPC_ID" --region "$REGION" --output text --query "GroupId")
  aws ec2 authorize-security-group-ingress --group-id "$RDS_SG_ID" --protocol tcp --port 5432 --source-group "$ECS_SG_ID" --region "$REGION" >/dev/null
  log "Created RDS security group: $RDS_SG_ID"
else
  log "RDS security group exists: $RDS_SG_ID"
fi

# ─── Step 4: RDS PostgreSQL ─────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 4: RDS PostgreSQL"
echo "═══════════════════════════════════════════════"

# DB subnet group
if ! aws rds describe-db-subnet-groups --db-subnet-group-name "${APP_NAME}-db-subnets" --region "$REGION" >/dev/null 2>&1; then
  aws rds create-db-subnet-group \
    --db-subnet-group-name "${APP_NAME}-db-subnets" \
    --db-subnet-group-description "Subnets for ${APP_NAME} RDS" \
    --subnet-ids "$SUBNET_1" "$SUBNET_2" \
    --region "$REGION" >/dev/null
  log "Created DB subnet group"
else
  log "DB subnet group exists"
fi

# Create RDS instance if it doesn't exist
RDS_STATUS=$(aws rds describe-db-instances --db-instance-identifier "${APP_NAME}-db" --query "DBInstances[0].DBInstanceStatus" --output text --region "$REGION" 2>/dev/null || echo "not-found")

if [ "$RDS_STATUS" = "not-found" ]; then
  # Save password to Secrets Manager
  SECRET_ARN=$(aws secretsmanager create-secret \
    --name "${APP_NAME}/db-password" \
    --secret-string "$DB_PASS" \
    --region "$REGION" \
    --query "ARN" --output text 2>/dev/null || \
    aws secretsmanager put-secret-value \
    --secret-id "${APP_NAME}/db-password" \
    --secret-string "$DB_PASS" \
    --region "$REGION" && \
    aws secretsmanager describe-secret --secret-id "${APP_NAME}/db-password" --region "$REGION" --query "ARN" --output text)

  aws rds create-db-instance \
    --db-instance-identifier "${APP_NAME}-db" \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 16 \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASS" \
    --db-name "$DB_NAME" \
    --allocated-storage 20 \
    --vpc-security-group-ids "$RDS_SG_ID" \
    --db-subnet-group-name "${APP_NAME}-db-subnets" \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --storage-encrypted \
    --region "$REGION" >/dev/null

  log "Creating RDS instance (this takes 5-10 minutes)..."
  aws rds wait db-instance-available --db-instance-identifier "${APP_NAME}-db" --region "$REGION"
  log "RDS instance is ready"
else
  log "RDS instance exists (status: $RDS_STATUS)"
  DB_PASS=$(aws secretsmanager get-secret-value --secret-id "${APP_NAME}/db-password" --region "$REGION" --query "SecretString" --output text 2>/dev/null || echo "")
  if [ -z "$DB_PASS" ]; then
    warn "Could not retrieve DB password from Secrets Manager. You may need to update it manually."
  fi
fi

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier "${APP_NAME}-db" --query "DBInstances[0].Endpoint.Address" --output text --region "$REGION")
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}:5432/${DB_NAME}?schema=public"
log "RDS endpoint: $RDS_ENDPOINT"

# ─── Step 5: ECS Cluster ────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 5: ECS Cluster & Task"
echo "═══════════════════════════════════════════════"

# Create cluster
if ! aws ecs describe-clusters --clusters "$APP_NAME" --region "$REGION" --query "clusters[?status=='ACTIVE']" --output text | grep -q "$APP_NAME"; then
  aws ecs create-cluster --cluster-name "$APP_NAME" --region "$REGION" >/dev/null
  log "Created ECS cluster"
else
  log "ECS cluster exists"
fi

# IAM role for ECS task execution
EXEC_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${APP_NAME}-ecs-execution-role"
if ! aws iam get-role --role-name "${APP_NAME}-ecs-execution-role" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name "${APP_NAME}-ecs-execution-role" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' >/dev/null
  aws iam attach-role-policy \
    --role-name "${APP_NAME}-ecs-execution-role" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" >/dev/null
  log "Created ECS execution role"
  sleep 10  # Wait for IAM propagation
else
  log "ECS execution role exists"
fi

# CloudWatch log group
aws logs create-log-group --log-group-name "/ecs/${APP_NAME}" --region "$REGION" 2>/dev/null || true
log "Log group ready"

# Generate AUTH_SECRET for production
AUTH_SECRET=$(openssl rand -base64 32)

# Register task definition
cat > /tmp/task-def.json <<TASKEOF
{
  "family": "${APP_NAME}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "containerDefinitions": [{
    "name": "${APP_NAME}",
    "image": "${ECR_REPO}:latest",
    "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
    "environment": [
      {"name": "DATABASE_URL", "value": "${DATABASE_URL}"},
      {"name": "AUTH_SECRET", "value": "${AUTH_SECRET}"},
      {"name": "AUTH_URL", "value": "https://${DOMAIN}"},
      {"name": "NEXT_PUBLIC_APP_URL", "value": "https://${DOMAIN}"},
      {"name": "NEXT_PUBLIC_APP_DOMAIN", "value": "buckheadwebservices.com"},
      {"name": "NODE_ENV", "value": "production"},
      {"name": "S3_BUCKET_NAME", "value": "memberwise-assets"},
      {"name": "AWS_REGION", "value": "${REGION}"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${APP_NAME}",
        "awslogs-region": "${REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -q --spider http://localhost:3000/api/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }]
}
TASKEOF

aws ecs register-task-definition --cli-input-json file:///tmp/task-def.json --region "$REGION" >/dev/null
log "Registered task definition"

# ─── Step 6: Application Load Balancer ──────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 6: Load Balancer"
echo "═══════════════════════════════════════════════"

ALB_ARN=$(aws elbv2 describe-load-balancers --names "${APP_NAME}-alb" --query "LoadBalancers[0].LoadBalancerArn" --output text --region "$REGION" 2>/dev/null || echo "None")

if [ "$ALB_ARN" = "None" ] || [ -z "$ALB_ARN" ]; then
  ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "${APP_NAME}-alb" \
    --subnets "$SUBNET_1" "$SUBNET_2" \
    --security-groups "$ALB_SG_ID" \
    --scheme internet-facing \
    --type application \
    --region "$REGION" \
    --query "LoadBalancers[0].LoadBalancerArn" --output text)
  log "Created ALB"
else
  log "ALB exists"
fi

ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query "LoadBalancers[0].DNSName" --output text --region "$REGION")
log "ALB DNS: $ALB_DNS"

# Target group
TG_ARN=$(aws elbv2 describe-target-groups --names "${APP_NAME}-tg" --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION" 2>/dev/null || echo "None")

if [ "$TG_ARN" = "None" ] || [ -z "$TG_ARN" ]; then
  TG_ARN=$(aws elbv2 create-target-group \
    --name "${APP_NAME}-tg" \
    --protocol HTTP \
    --port 3000 \
    --vpc-id "$VPC_ID" \
    --target-type ip \
    --health-check-path "/api/health" \
    --health-check-interval-seconds 30 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region "$REGION" \
    --query "TargetGroups[0].TargetGroupArn" --output text)
  log "Created target group"
else
  # Ensure health check path is up to date
  aws elbv2 modify-target-group \
    --target-group-arn "$TG_ARN" \
    --health-check-path "/api/health" \
    --region "$REGION" >/dev/null 2>&1 || true
  log "Target group exists (health check updated)"
fi

# Check for existing HTTPS certificate
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 6b: SSL Certificate"
echo "═══════════════════════════════════════════════"

CERT_ARN=$(aws acm list-certificates --region "$REGION" --query "CertificateSummaryList[?DomainName=='${DOMAIN}' || DomainName=='*.buckheadwebservices.com'].CertificateArn | [0]" --output text 2>/dev/null)

if [ "$CERT_ARN" = "None" ] || [ -z "$CERT_ARN" ]; then
  CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN" \
    --validation-method DNS \
    --region "$REGION" \
    --query "CertificateArn" --output text)
  log "Requested SSL certificate: $CERT_ARN"

  sleep 5

  # Get DNS validation record
  VALIDATION=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$REGION" --query "Certificate.DomainValidationOptions[0]")
  CNAME_NAME=$(echo "$VALIDATION" | python3 -c "import sys,json; print(json.load(sys.stdin)['ResourceRecord']['Name'])")
  CNAME_VALUE=$(echo "$VALIDATION" | python3 -c "import sys,json; print(json.load(sys.stdin)['ResourceRecord']['Value'])")

  echo ""
  warn "SSL certificate needs DNS validation!"
  echo "  Add this CNAME record to your DNS:"
  echo "    Name:  $CNAME_NAME"
  echo "    Value: $CNAME_VALUE"
  echo ""
  echo "  Waiting for certificate validation (add the DNS record now)..."
  echo "  Press Ctrl+C if you want to add it later and re-run this script."

  aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region "$REGION" 2>/dev/null || true

  CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$REGION" --query "Certificate.Status" --output text)
  if [ "$CERT_STATUS" != "ISSUED" ]; then
    warn "Certificate not yet validated. Setting up HTTP listener only."
    CERT_ARN=""
  else
    log "Certificate validated!"
  fi
else
  log "SSL certificate found: $CERT_ARN"
fi

# HTTP Listener
LISTENER_EXISTS=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query "Listeners[?Port==\`80\`].ListenerArn | [0]" --output text --region "$REGION" 2>/dev/null || echo "None")

if [ "$LISTENER_EXISTS" = "None" ] || [ -z "$LISTENER_EXISTS" ]; then
  if [ -n "$CERT_ARN" ]; then
    # Create HTTPS listener + HTTP redirect
    aws elbv2 create-listener \
      --load-balancer-arn "$ALB_ARN" \
      --protocol HTTPS --port 443 \
      --certificates CertificateArn="$CERT_ARN" \
      --default-actions Type=forward,TargetGroupArn="$TG_ARN" \
      --region "$REGION" >/dev/null
    aws elbv2 create-listener \
      --load-balancer-arn "$ALB_ARN" \
      --protocol HTTP --port 80 \
      --default-actions 'Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
      --region "$REGION" >/dev/null
    log "Created HTTPS + HTTP redirect listeners"
  else
    aws elbv2 create-listener \
      --load-balancer-arn "$ALB_ARN" \
      --protocol HTTP --port 80 \
      --default-actions Type=forward,TargetGroupArn="$TG_ARN" \
      --region "$REGION" >/dev/null
    log "Created HTTP listener (add HTTPS later after cert validation)"
  fi
else
  log "Listener already exists"
fi

# ─── Step 7: ECS Service ────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 7: ECS Service"
echo "═══════════════════════════════════════════════"

SERVICE_STATUS=$(aws ecs describe-services --cluster "$APP_NAME" --services "${APP_NAME}-service" --query "services[?status=='ACTIVE'].serviceName | [0]" --output text --region "$REGION" 2>/dev/null || echo "None")

if [ "$SERVICE_STATUS" = "None" ] || [ -z "$SERVICE_STATUS" ]; then
  aws ecs create-service \
    --cluster "$APP_NAME" \
    --service-name "${APP_NAME}-service" \
    --task-definition "$APP_NAME" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=$APP_NAME,containerPort=3000" \
    --region "$REGION" >/dev/null
  log "Created ECS service"
else
  aws ecs update-service \
    --cluster "$APP_NAME" \
    --service "${APP_NAME}-service" \
    --task-definition "$APP_NAME" \
    --force-new-deployment \
    --region "$REGION" >/dev/null
  log "Updated ECS service with new deployment"
fi

# ─── Step 8: Run DB Migrations ──────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 8: Database Migration"
echo "═══════════════════════════════════════════════"

log "Migrations will run automatically via Prisma on first connection"
log "If you need to run manually, use: npx prisma db push"

# ─── Done ────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  Deployment Complete!"
echo "═══════════════════════════════════════════════"
echo ""
echo "  ALB DNS:    http://$ALB_DNS"
echo "  Domain:     https://$DOMAIN"
echo "  RDS Host:   $RDS_ENDPOINT"
echo "  ECR Image:  $FULL_IMAGE"
echo ""
echo "  Next steps:"
echo "  1. Add a CNAME record pointing $DOMAIN to $ALB_DNS"
if [ -z "$CERT_ARN" ]; then
echo "  2. Validate the SSL certificate and add HTTPS listener"
fi
echo "  3. Run database migration: npx prisma db push"
echo "  4. Monitor logs: aws logs tail /ecs/$APP_NAME --follow"
echo ""
