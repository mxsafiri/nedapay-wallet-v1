'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertOctagon, Shield, Clock } from 'lucide-react';

export interface SecurityAlert {
  id: string;
  type: 'login_attempt' | 'rate_limit' | 'suspicious_tx';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  onDismiss: (id: string) => void;
  onViewDetails: (alert: SecurityAlert) => void;
}

export function SecurityAlerts({ alerts, onDismiss, onViewDetails }: SecurityAlertsProps) {
  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'login_attempt':
        return <Shield className="text-blue-500" size={16} />;
      case 'rate_limit':
        return <Clock className="text-yellow-500" size={16} />;
      case 'suspicious_tx':
        return <AlertOctagon className="text-red-500" size={16} />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Security Alerts</h3>
        <Badge variant="outline">{alerts.length} Active</Badge>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 border rounded-lg flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{alert.type.replace('_', ' ').toUpperCase()}</span>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(alert)}
              >
                Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(alert.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No active security alerts
          </div>
        )}
      </div>
    </Card>
  );
}
