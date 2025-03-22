'use client';

import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { DemoControls } from '@/components/admin/demo/DemoControls';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Activity, Wallet, RefreshCw } from 'lucide-react';
import { demoConfig } from '@/lib/config/demo';

export default function DemoPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Banking Partner Demo</h1>
            <p className="text-muted-foreground">
              Configure and test the wallet system in a controlled environment
            </p>
          </div>
        </div>

        <Alert variant="warning" className="bg-[#2A1F06] border-[#F5A524] text-[#F5A524]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode Active</AlertTitle>
          <AlertDescription className="text-[#F5A524]/80">
            You are in demo mode. All transactions are simulated and no real money is involved.
            Use these controls to test different scenarios and system behavior.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <DemoControls />
          </div>

          <div className="space-y-6">
            <Card className="p-6 card-gradient">
              <h2 className="text-lg font-semibold mb-4">Demo Features</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Simulated Banking</div>
                    <div className="text-sm text-muted-foreground">
                      Test transactions with configurable delays and failures
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <Wallet className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Transaction Control</div>
                    <div className="text-sm text-muted-foreground">
                      Manage transaction flows and test error scenarios
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Real-time Reconciliation</div>
                    <div className="text-sm text-muted-foreground">
                      Monitor and verify transaction states instantly
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-gradient">
              <h2 className="text-lg font-semibold mb-4">Demo Limitations</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="text-sm">Maximum Transaction</div>
                  <div className="font-medium text-primary">
                    ${demoConfig.limits.maxTransactionValue}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="text-sm">Daily Transactions</div>
                  <div className="font-medium text-primary">
                    {demoConfig.limits.maxDailyTransactions}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="text-sm">Currency Support</div>
                  <div className="font-medium text-muted-foreground">USD Only</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="text-sm">KYC Tiers</div>
                  <div className="font-medium text-muted-foreground">Basic Only</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="text-sm">Advanced Features</div>
                  <div className="font-medium text-muted-foreground">Not Available</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
