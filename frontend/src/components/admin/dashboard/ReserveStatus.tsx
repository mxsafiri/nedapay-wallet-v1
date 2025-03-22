'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ReserveStatusProps {
  currentRatio: number;
  totalReserves: number;
  lastReconciliation: Date;
  targetRatio?: number;
}

export function ReserveStatus({ 
  currentRatio, 
  totalReserves, 
  lastReconciliation, 
  targetRatio = 100 
}: ReserveStatusProps) {
  const isHealthy = currentRatio >= targetRatio;
  const formattedDate = lastReconciliation.toLocaleString();

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Reserve Status</h3>
        {isHealthy ? (
          <ShieldCheck className="text-green-500" size={24} />
        ) : (
          <AlertTriangle className="text-yellow-500" size={24} />
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Reserve Ratio</span>
            <Badge variant={isHealthy ? "success" : "warning"}>
              {currentRatio}%
            </Badge>
          </div>
          <Progress value={currentRatio} max={targetRatio} />
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Total Reserves</span>
          <div className="text-2xl font-bold mt-1">
            {formatCurrency(totalReserves)}
          </div>
        </div>

        <div className="pt-4 border-t">
          <span className="text-sm text-muted-foreground">Last Reconciliation</span>
          <div className="text-sm mt-1">{formattedDate}</div>
        </div>
      </div>
    </Card>
  );
}
