# NEDApay Wallet Partner Portal Deployment

This directory contains deployment configurations and scripts for the NEDApay Wallet Partner Portal.

## Directory Structure

```
deploy/
├── docker/              # Docker configurations
├── environments/        # Environment-specific configs
├── scripts/            # Deployment scripts
└── k8s/                # Kubernetes configurations
```

## Quick Start

1. Set up environment variables:
   ```bash
   cp environments/.env.example environments/.env.production
   ```

2. Build the Docker image:
   ```bash
   ./scripts/build.sh
   ```

3. Deploy to environment:
   ```bash
   ./scripts/deploy.sh [environment]
   ```

## Deployment Environments

- `demo` - Banking Partner Demo Environment
- `staging` - Pre-production Testing
- `production` - Live Production Environment

## Security Notes

- All secrets are managed through environment variables
- SSL/TLS is enforced for all environments
- Regular security audits are performed
- Access logs are maintained for all environments
