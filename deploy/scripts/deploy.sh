#!/bin/bash

# Exit on error
set -e

# Default environment
ENVIRONMENT=${1:-demo}

# Validate environment
if [ "$ENVIRONMENT" != "demo" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Invalid environment. Use 'demo' or 'production'"
    exit 1
fi

# Load environment variables
if [ -f "./deploy/environments/.env.$ENVIRONMENT" ]; then
    source "./deploy/environments/.env.$ENVIRONMENT"
else
    echo "Environment file not found: .env.$ENVIRONMENT"
    exit 1
fi

echo "Deploying to $ENVIRONMENT environment..."

# Build Docker image
echo "Building Docker image..."
docker-compose -f deploy/docker/docker-compose.yml build

# Push to container registry (if using one)
if [ -n "$CONTAINER_REGISTRY" ]; then
    echo "Pushing to container registry..."
    docker tag nedapay-bank-portal:latest "$CONTAINER_REGISTRY/nedapay-bank-portal:latest"
    docker push "$CONTAINER_REGISTRY/nedapay-bank-portal:latest"
fi

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to production..."
    # Add production-specific deployment steps here
    # Example: AWS ECS deployment
    aws ecs update-service --cluster production --service bank-portal --force-new-deployment
else
    echo "Deploying to demo environment..."
    # Add demo environment deployment steps here
    # Example: Deploy to staging ECS cluster
    aws ecs update-service --cluster demo --service bank-portal --force-new-deployment
fi

echo "Deployment complete!"
