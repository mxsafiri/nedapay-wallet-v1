'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Setup2FAPage() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  // Fetch 2FA setup data on mount
  const fetchSetupData = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate 2FA setup');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up 2FA');
    }
  };

  // Verify the 2FA code
  const verifyCode = async () => {
    try {
      setError(null);
      
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/verify-2fa-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      // Redirect to admin dashboard after successful setup
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set Up Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            Enhance your account security by setting up 2FA
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Install Google Authenticator or a similar TOTP app on your phone
            </p>
            <p className="text-sm text-muted-foreground">
              2. Scan the QR code below or enter the secret key manually
            </p>
            <p className="text-sm text-muted-foreground">
              3. Enter the verification code shown in your app
            </p>
          </div>

          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}

          {secret && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono text-center">{secret}</p>
            </div>
          )}

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
            <Button 
              className="w-full" 
              onClick={verifyCode}
              disabled={verificationCode.length !== 6}
            >
              Verify and Complete Setup
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
