# NEDApay Wallet

A secure, custodial stablecoin wallet system with fiat on/off-ramp integration.

## Features
- Custodial wallets with reserve-backed system
- Fiat on/off-ramp integration
- Secure API with JWT authentication
- KYC verification
- Real-time reserve tracking

**Note:** This MVP **does not include staking, governance, or lending features**.  
These may be explored in future iterations.

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

## Tech Stack
- Backend: Rust (Axum framework)
- Database: PostgreSQL
- Caching: Redis
- Authentication: JWT + OAuth
- API Documentation: OpenAPI/Swagger

## Development Roadmap

### Phase 1: Core Backend Infrastructure 
- [ ] Database schema design
  - [ ] User accounts and KYC data
  - [ ] Wallet and balance tracking
  - [ ] Transaction ledger
  - [ ] Reserve management
- [ ] Authentication system
  - [ ] JWT implementation
  - [ ] OAuth scopes
  - [ ] Rate limiting

### Phase 2: Financial Core 
- [ ] Wallet Service
  - [ ] Balance management
  - [ ] Transaction processing
  - [ ] Reserve tracking
- [ ] Transaction System
  - [ ] Double-entry accounting
  - [ ] Automated reconciliation
  - [ ] Circuit breakers

### Phase 3: Integration Layer 
- [ ] FSP Integration
  - [ ] Bank deposit/withdrawal
  - [ ] Mobile money integration
  - [ ] Payment processing
- [ ] KYC/Identity System
  - [ ] User verification flow
  - [ ] Document processing
  - [ ] Risk scoring

### Phase 4: API Layer 
- [ ] REST API Implementation
  - [ ] User endpoints
  - [ ] Wallet endpoints
  - [ ] Transaction endpoints
- [ ] API Security
  - [ ] Request validation
  - [ ] Input sanitization
  - [ ] Response formatting

### Phase 5: Frontend Development 
- [ ] User Interface
  - [ ] Authentication screens
  - [ ] Wallet dashboard
  - [ ] Transaction history
- [ ] Integration
  - [ ] API integration
  - [ ] Real-time updates
  - [ ] Error handling

### Phase 6: Testing & Deployment 
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Security audits
- [ ] Deployment
  - [ ] CI/CD setup
  - [ ] Monitoring
  - [ ] Documentation

## Project Structure
```
nedapay-wallet-v1/
├── frontend/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/             # Next.js App Router Pages
│   │   ├── components/      # React Components
│   │   ├── hooks/          # Custom React Hooks
│   │   └── lib/            # Utilities and Services
├── src/                    # Rust Backend
│   ├── api/               # API Routes & Handlers
│   ├── auth/              # Authentication and Authorization
│   ├── config/            # Configuration Management
│   ├── db/               # Database Models
│   ├── handlers/         # Request Handlers
│   ├── models/           # Data Models
│   ├── services/         # Business Logic
│   └── utils/            # Utility Functions
├── migrations/           # Database Migrations
├── tests/               # Integration Tests
└── docs/               # Documentation
```

## Environment Setup

### Backend (.env)
```env
# Deployment Mode
DEPLOYMENT_MODE=demo  # or 'production'

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nedapay
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Feature Flags
ENABLE_KYC=true
ENABLE_TRANSACTIONS=true
```

### Frontend (.env)
```env
# Deployment Mode
NEXT_PUBLIC_DEPLOYMENT_MODE=demo  # or 'production'

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_STAKING=false
NEXT_PUBLIC_ENABLE_GOVERNANCE=false
```

## Security Requirements
- JWT authentication for all endpoints
- Input validation and sanitization
- Rate limiting and request throttling
- Secure session management
- Data encryption at rest
- Audit logging
- Automatic blocking of suspicious patterns

## Limitations in MVP
- **Staking is NOT included** in the first version
- Multi-currency support will be **added later**
- Basic KYC tiers only
- Single-signature transactions only
- No governance features
- No lending capabilities

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Start the development servers
4. Read the [CONTRIBUTING.md](CONTRIBUTING.md) guide

## License

Copyright 2025 NEDApay. All rights reserved.
