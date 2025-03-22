# NEDApay Wallet - Banking Partner Demo Deployment

This guide outlines the deployment process for the Banking Partner Demo version of NEDApay Wallet.

## Overview

The Banking Partner Demo is a controlled environment designed to showcase the system's capabilities to potential banking partners. It features:

- 🏦 Simulated banking interactions
- 💳 Full transaction lifecycle demos
- 📊 Real-time reconciliation tools
- 🔄 Configurable transaction scenarios
- ⚡ Instant deployment options

## Deployment Options

### 1. Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Configure environment variables
vercel env add NEXT_PUBLIC_DEPLOYMENT_MODE demo
vercel env add NEXT_PUBLIC_MOCK_API_DELAY 2000
vercel env add NEXT_PUBLIC_MOCK_FAILURE_RATE 0.1
```

### 2. Backend Deployment (Railway.app)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy from root directory
railway up

# Configure environment variables
railway variables set DEPLOYMENT_MODE=demo
railway variables set DB_DEMO=postgres://...
```

## Environment Configuration

### Frontend (.env)
```env
# Demo Mode
NEXT_PUBLIC_DEPLOYMENT_MODE=demo
NEXT_PUBLIC_API_URL=https://api-demo.nedapay.com
NEXT_PUBLIC_MOCK_API_DELAY=2000
NEXT_PUBLIC_MOCK_FAILURE_RATE=0.1

# Feature Flags
NEXT_PUBLIC_ENABLE_DEMO_CONTROLS=true
NEXT_PUBLIC_ENABLE_INSTANT_RECONCILIATION=true
```

### Backend (.env)
```env
DEPLOYMENT_MODE=demo
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_SECRET=demo_secret
DEMO_API_KEY=demo_key_123
```

## Demo Features

### 1. Transaction Simulation
- Configurable processing delays
- Adjustable failure rates
- Predefined transaction scenarios

### 2. Banking Integration Demo
- Mock bank API responses
- Simulated account validation
- Test transaction flows

### 3. Reconciliation Tools
- Real-time balance checking
- Automated discrepancy detection
- Manual reconciliation triggers

### 4. Admin Controls
- Transaction status manipulation
- Balance adjustment tools
- Error scenario simulation

## Security Measures

Even in demo mode, we maintain security best practices:
- JWT authentication required
- Rate limiting enabled
- Input validation enforced
- Audit logging active

## Monitoring

Demo deployments include:
- Error tracking (Sentry)
- Performance monitoring
- API usage statistics
- Demo session analytics

## Customization

### Transaction Scenarios
```typescript
// Configure in frontend/src/lib/config/demo.ts
export const demoScenarios = {
  instantSuccess: { delay: 0, failureRate: 0 },
  normalProcessing: { delay: 2000, failureRate: 0.1 },
  highFailure: { delay: 1000, failureRate: 0.5 },
};
```

### API Responses
```typescript
// Customize in frontend/src/lib/mock-api/banking.ts
export const mockResponses = {
  successfulDeposit: { status: 'success', delay: 2000 },
  failedWithdrawal: { status: 'failed', error: 'Insufficient funds' },
  pendingTransaction: { status: 'pending', delay: 5000 },
};
```

## Demo Data Reset

The demo environment automatically resets every 24 hours to ensure a clean state for presentations. Manual reset available through admin controls.

## Support

For demo deployment support:
- Email: support@nedapay.com
- Documentation: https://docs.nedapay.com/demo
- Status: https://status.nedapay.com
