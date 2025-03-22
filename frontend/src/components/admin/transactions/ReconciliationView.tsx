'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReconciliationResult } from '@/lib/services/transaction';

interface ReconciliationViewProps {
  result: ReconciliationResult | null;
}

export function ReconciliationView({ result }: ReconciliationViewProps) {
  if (!result) {
    return null;
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Reconciliation Result
          <Badge
            variant="secondary"
            className={`${
              result.success ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {result.success ? 'Matched' : 'Discrepancy Found'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Reserve Balance</div>
              <div className="text-lg font-semibold">
                {formatAmount(result.reserveBalance)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Wallet Balance</div>
              <div className="text-lg font-semibold">
                {formatAmount(result.walletBalance)}
              </div>
            </div>
          </div>

          {result.discrepancy !== null && (
            <div>
              <div className="text-sm text-gray-500">Discrepancy Amount</div>
              <div className="text-lg font-semibold text-red-500">
                {formatAmount(result.discrepancy)}
              </div>
            </div>
          )}

          {result.error && (
            <div className="text-sm text-red-500 mt-2">{result.error}</div>
          )}

          {!result.success && (
            <div className="text-sm text-gray-500 mt-4">
              <strong>Note:</strong> A discrepancy has been detected. The system
              has automatically logged this incident and notified the relevant
              team for investigation.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
