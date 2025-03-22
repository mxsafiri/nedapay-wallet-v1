# NEDApay Bank Partner Portal

A secure banking integration portal for financial institutions to connect with the NEDApay Wallet system. This portal provides banks with the tools to manage deposits, withdrawals, and monitor transactions.

## Features
- Secure bank transaction processing
- Real-time transaction monitoring
- Automated reconciliation
- Transaction status tracking
- Bank account verification
- Comprehensive audit logs
- Demo mode for integration testing

## Portal Types

This portal supports two deployment modes:

- **Integration Testing** → Sandbox environment for banks to test API integration
- **Production Portal** → Live system for processing real transactions

### Environment Configuration
Set the correct mode before deployment:

| Mode | Environment Variable | API Access | Features |
|------|---------------------|------------|-----------|
| Demo | `DEPLOYMENT_MODE=demo` | Restricted | Mock responses, Test data |
| Production | `DEPLOYMENT_MODE=production` | Full | Live processing |

### Demo Mode Features
- Mock API responses with configurable delays
- Simulated transaction processing
- Test account integration
- Sandbox environment
- Integration testing tools

### Production Mode Features
- Live transaction processing
- Real-time monitoring
- Full security features
- Automated reconciliation
- Detailed audit trails

## Tech Stack
- Frontend: Next.js + TypeScript
- Authentication: JWT + OAuth
- API Documentation: OpenAPI/Swagger
- UI: Tailwind CSS + Shadcn

## Development Roadmap

### Phase 1: Core Integration
- [x] Transaction API implementation
- [x] Bank account verification
- [x] Mock API for testing
- [ ] Production API integration

### Phase 2: Security & Monitoring
- [x] JWT authentication
- [x] Rate limiting
- [x] Input validation
- [ ] Advanced monitoring

### Phase 3: Testing & Documentation
- [x] Integration test suite
- [x] API documentation
- [ ] Bank onboarding guide
- [ ] Security compliance docs

### Phase 4: Bank Tools
- [x] Transaction dashboard
- [x] Reconciliation tools
- [ ] Reporting system
- [ ] Analytics dashboard

## Security
- All endpoints require authentication
- Rate limiting on all API routes
- Input validation and sanitization
- Comprehensive audit logging
- Regular security assessments

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Documentation
- [API Documentation](./docs/api.md)
- [Integration Guide](./docs/integration-guide.md)
- [Security Overview](./docs/security.md)
- [Demo Mode Guide](./docs/demo-mode.md)
