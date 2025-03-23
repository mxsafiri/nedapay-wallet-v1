#!/bin/bash

# Generate new NextAuth secret
NEW_AUTH_SECRET=$(openssl rand -base64 32)
echo "Generated new NextAuth secret"

# Generate new admin password
NEW_ADMIN_PASSWORD=$(openssl rand -base64 24)
echo "Generated new admin password"

# Update GitHub Secrets using gh cli
if command -v gh &> /dev/null; then
    echo "Updating GitHub secrets..."
    gh secret set NEXTAUTH_SECRET -b"$NEW_AUTH_SECRET"
    gh secret set ADMIN_PASSWORD -b"$NEW_ADMIN_PASSWORD"
fi

# Update Vercel Environment Variables using Vercel CLI
if command -v vercel &> /dev/null; then
    echo "Updating Vercel environment variables..."
    vercel env add NEXTAUTH_SECRET production
    vercel env add ADMIN_PASSWORD production
fi

echo "⚠️ Important: Save these values securely!"
echo "New NextAuth Secret: $NEW_AUTH_SECRET"
echo "New Admin Password: $NEW_ADMIN_PASSWORD"
echo "✅ Remember to:"
echo "1. Update your local .env.production"
echo "2. Notify relevant team members"
echo "3. Plan a maintenance window if needed"
