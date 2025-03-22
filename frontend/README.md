# NEDApay Wallet Frontend

A secure, modern frontend for the NEDApay Wallet system built with Next.js 13, TypeScript, and Tailwind CSS.

## Features

- 🔐 Secure authentication with JWT
- 📱 Responsive admin dashboard
- 🏦 Banking partner integration demo
- 📄 KYC document verification
- 💳 Transaction monitoring
- 🔄 Real-time updates
- ⚡ Optimized performance

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment Strategy

This project supports two separate deployments:

- **Banking Partner Demo** → Used for API integration testing and showcasing features to banks.  
- **Full Wallet Deployment** → The production system for real users.  

### Environment Configuration
Set the correct mode before deployment:  

| Mode | Environment Variable | Database | API Access |
|------|---------------------|----------|------------|
| Demo | `DEPLOYMENT_MODE=demo` | `DB_DEMO` | Restricted |
| Production | `DEPLOYMENT_MODE=production` | `DB_PROD` | Open |

Use **`.env` files** or **feature flags** to switch between deployments.

### Demo Mode Features
- Mock API responses with configurable delays
- Simulated transaction processing
- Test data for demonstration
- Restricted API access
- Sandbox environment

### Production Mode Features
- Live API integration
- Real transaction processing
- Production database
- Full feature access
- Enhanced security measures

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development

# Deployment Mode
NEXT_PUBLIC_DEPLOYMENT_MODE=demo

# Feature Flags
NEXT_PUBLIC_ENABLE_STAKING=false
NEXT_PUBLIC_ENABLE_GOVERNANCE=false
NEXT_PUBLIC_ENABLE_LENDING=false

# Demo Configuration
NEXT_PUBLIC_MOCK_API_DELAY=2000
NEXT_PUBLIC_MOCK_FAILURE_RATE=0.1
```

## Project Structure

```
src/
├── app/              # Next.js App Router Pages
├── components/       # React Components
├── hooks/           # Custom React Hooks
├── lib/             # Utilities and Services
└── types/          # TypeScript Types
```

## Development

### Code Style

- Follow TypeScript best practices
- Use functional components
- Implement proper error handling
- Write meaningful comments
- Follow project structure

### Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Run linting
npm run lint
```

## Security

- All API calls use JWT authentication
- Sensitive data is never stored in localStorage
- CSRF protection enabled
- Input validation on all forms
- XSS protection via React

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## License

Copyright © 2025 NEDApay. All rights reserved.
