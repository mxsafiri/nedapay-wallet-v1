'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { api } from '@/lib/api';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: any;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export default function SecurityPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserveRatio, setReserveRatio] = useState<number>(0);

  useEffect(() => {
    fetchAlerts();
    fetchReserveRatio();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/admin/security/alerts');
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReserveRatio = async () => {
    try {
      const response = await api.get('/admin/security/monitor/reserve');
      setReserveRatio(response.data.data.ratio);
    } catch (error) {
      console.error('Failed to fetch reserve ratio:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await api.post(`/admin/security/alerts/${alertId}/resolve`);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const runSecurityChecks = async () => {
    try {
      await Promise.all([
        api.post('/admin/security/monitor/reserve'),
        api.post('/admin/security/monitor/access', {
          action: 'security_check',
          ip_address: window.location.hostname,
        }),
      ]);
      fetchAlerts();
      fetchReserveRatio();
    } catch (error) {
      console.error('Failed to run security checks:', error);
    }
  };

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-100';
      case 'high':
        return 'text-orange-500 bg-orange-100';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100';
      case 'low':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Security</h1>
          <Button onClick={runSecurityChecks} disabled={loading}>
            <Shield className="mr-2 h-4 w-4" />
            Run Security Checks
          </Button>
        </div>

        {/* Security Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Reserve Ratio</h3>
            <div className="text-3xl font-bold">
              {(reserveRatio * 100).toFixed(2)}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Target: 100% minimum ratio
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Active Alerts</h3>
            <div className="text-3xl font-bold">
              {alerts.filter((a) => !a.resolved).length}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Unresolved security alerts
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">System Status</h3>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-lg">All Systems Operational</span>
            </div>
          </Card>
        </div>

        {/* Security Alerts */}
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Security Alerts</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge
                      className={getSeverityColor(alert.severity)}
                    >
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.alert_type}</TableCell>
                  <TableCell>{alert.description}</TableCell>
                  <TableCell>
                    {new Date(alert.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={alert.resolved ? 'outline' : 'secondary'}
                    >
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!alert.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Security Recommendations */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">
            Security Recommendations
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Enable Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">
                  Enhance account security by enabling 2FA for all admin users.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Regular Security Audits</h3>
                <p className="text-sm text-gray-600">
                  Conduct regular security audits to identify potential
                  vulnerabilities.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
