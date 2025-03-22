# Contribution Guide for NEDApay Wallet

## Deployment Strategy

NEDApay Wallet has two separate deployments:  

1. **Banking Partner Demo** (for showcasing to banks)  
   - **Frontend:** Hosted separately (Vercel/Netlify)  
   - **Backend:** Uses sandbox mode (restricted API access)  
   - **Database:** Test/staging database  
   - **Purpose:** Demonstration and testing with potential partners  

2. **Full Wallet System** (for real users)  
   - **Frontend:** Production-ready UI with full feature set  
   - **Backend:** Real transaction processing with mobile money and bank API integrations  
   - **Database:** Production database with full KYC and compliance  

## Development Notes
- Do **not** mix the demo and production environments in the same deployment
- Use **feature flags** and separate environment variables for staging vs. production
- If adding a new API, ensure it supports both **sandbox mode (for demo)** and **live mode (for real users)**

## Project Structure

```
nedapay-wallet-v1/
├── frontend/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/             # Next.js App Router Pages
│   │   │   ├── admin/       # Admin Interface
│   │   │   ├── auth/        # Authentication Pages
│   │   │   └── wallet/      # User Wallet Interface
│   │   ├── components/      # React Components
│   │   │   ├── admin/       # Admin-specific Components
│   │   │   ├── shared/      # Shared Components
│   │   │   └── ui/          # UI Component Library
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── lib/            
│   │   │   ├── api/        # API Integration Layer
│   │   │   ├── mock-api/   # Mock APIs for Demo
│   │   │   └── utils/      # Utility Functions
│   │   └── types/          # TypeScript Definitions
│   └── public/             # Static Assets
│
├── src/                    # Rust Backend
│   ├── api/               # API Routes & Handlers
│   │   ├── admin/        # Admin API Routes
│   │   ├── auth/         # Authentication Routes
│   │   └── wallet/       # Wallet API Routes
│   ├── models/           # Database Models
│   ├── services/         # Business Logic
│   │   ├── banking/      # Banking Integration
│   │   ├── mobile/       # Mobile Money Integration
│   │   └── wallet/       # Wallet Operations
│   └── utils/            # Utility Functions
│
├── migrations/           # Database Migrations
├── tests/               # Integration Tests
└── docs/               # Documentation
    ├── api/            # API Documentation
    ├── architecture/   # System Architecture
    └── deployment/     # Deployment Guides
```

## Environment Configuration

### Frontend (.env)
```env
# Common
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development

# Feature Flags
NEXT_PUBLIC_ENABLE_STAKING=false
NEXT_PUBLIC_ENABLE_GOVERNANCE=false
NEXT_PUBLIC_ENABLE_LENDING=false

# Demo Mode
NEXT_PUBLIC_IS_DEMO=false
NEXT_PUBLIC_MOCK_API_DELAY=2000
NEXT_PUBLIC_MOCK_FAILURE_RATE=0.1
```

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nedapay
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Environment
RUST_ENV=development
IS_DEMO=false

# Integration APIs
BANK_API_KEY=your-bank-api-key
MOBILE_MONEY_API_KEY=your-mobile-money-key

# Feature Flags
ENABLE_KYC=true
ENABLE_TRANSACTIONS=true
```

## Development Workflow

1. **Feature Branches**
   - Create from `develop` branch
   - Format: `feature/description`
   - Example: `feature/kyc-verification`

2. **Environment Setup**
   ```bash
   # Frontend
   cd frontend
   npm install
   npm run dev

   # Backend
   cargo build
   cargo run
   ```

3. **Testing**
   ```bash
   # Frontend
   npm run test
   npm run e2e

   # Backend
   cargo test
   ```

4. **Code Quality**
   - Run linters before committing
   - Ensure type safety
   - Follow project conventions

## Deployment Process

1. **Demo Environment**
   ```bash
   # Frontend
   NEXT_PUBLIC_IS_DEMO=true npm run build
   
   # Backend
   RUST_ENV=demo cargo build --release
   ```

2. **Production Environment**
   ```bash
   # Frontend
   NEXT_PUBLIC_IS_DEMO=false npm run build
   
   # Backend
   RUST_ENV=production cargo build --release
   ```

## Security Guidelines

1. **Authentication**
   - Always use JWT for API authentication
   - Implement proper token refresh
   - Use secure session management

2. **Data Protection**
   - Encrypt sensitive data
   - Use parameterized queries
   - Implement rate limiting

3. **API Security**
   - Validate all inputs
   - Use HTTPS only
   - Implement CORS properly

4. **Environment Security**
   - Never commit .env files
   - Use secrets management
   - Regular security audits

## Compliance Requirements

1. **KYC Implementation**
   - Document verification
   - Identity validation
   - Risk assessment

2. **Transaction Monitoring**
   - Real-time tracking
   - Fraud detection
   - Automated reconciliation

3. **Audit Trail**
   - Log all actions
   - Track changes
   - Maintain history

## Support and Resources

- **Documentation:** `/docs` directory
- **API Reference:** `/docs/api`
- **Architecture:** `/docs/architecture`
- **Deployment:** `/docs/deployment`

## Questions and Support

For questions or support:
1. Check existing documentation
2. Review closed issues
3. Open a new issue with details
