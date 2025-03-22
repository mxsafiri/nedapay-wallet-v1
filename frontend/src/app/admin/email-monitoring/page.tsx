'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AdminLayout from '@/components/layouts/AdminLayout';

// Register Chart.js components
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
}

interface QueueMetrics {
  pending_count: number;
  processing_count: number;
  failed_count: number;
  success_rate: number;
  average_processing_time: number;
  retries_count: number;
  timestamp: string;
}

interface QueuedEmail {
  id: string;
  to_email: string;
  subject: string;
  retries: number;
  created_at: string;
}

interface QueueStatus {
  metrics: QueueMetrics;
  failed_emails: QueuedEmail[];
  processing_emails: QueuedEmail[];
}

interface HealthStatus {
  metrics: QueueMetrics;
  health_status: 'Healthy' | 'Warning' | 'Critical';
  recommendations: string[];
}

export default function EmailMonitoring() {
  const [historicalData, setHistoricalData] = useState<QueueMetrics[]>([]);
  const [retryingEmails, setRetryingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch current metrics
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery<HealthStatus>({
    queryKey: ['emailMetrics'],
    queryFn: () => api.get('/monitoring/email/metrics').then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: 1000,
    staleTime: 20000,
  });

  // Fetch detailed status
  const { data: queueStatus, isLoading: statusLoading, error: statusError } = useQuery<QueueStatus>({
    queryKey: ['emailStatus'],
    queryFn: () => api.get('/monitoring/email/status').then(res => res.data),
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 20000,
  });

  // Update historical data
  useEffect(() => {
    if (healthData?.metrics) {
      setHistoricalData(prev => {
        const newData = [...prev, healthData.metrics].slice(-20);
        return newData;
      });
    }
    // Cleanup function
    return () => {
      setHistoricalData([]);
    };
  }, [healthData]);

  // Retry failed email
  const handleRetry = async (emailId: string) => {
    const controller = new AbortController();
    try {
      setRetryingEmails(prev => new Set(Array.from(prev).concat(emailId)));
      await api.get(`/monitoring/email/retry/${emailId}`, {
        signal: controller.signal
      });
      toast({
        title: 'Success',
        description: 'Email queued for retry',
        variant: 'default',
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      toast({
        title: 'Error',
        description: 'Failed to retry email',
        variant: 'destructive',
      });
    } finally {
      setRetryingEmails(prev => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
    }
    return () => controller.abort();
  };

  const chartData = {
    labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Success Rate',
        data: historicalData.map(d => d.success_rate),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Processing Time (ms)',
        data: historicalData.map(d => d.average_processing_time),
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1,
      },
    ],
  };

  if (healthLoading || statusLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Loading email monitoring data...</p>
      </div>
    );
  }

  if (healthError || statusError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="text-destructive mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground">
          {healthError?.message || statusError?.message || 'Failed to load monitoring data'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            window.location.reload();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!healthData || !queueStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="text-muted-foreground mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
        <p className="text-muted-foreground">
          The email monitoring system is not returning any data at the moment
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            window.location.reload();
          }}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Email Queue Monitoring</h1>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Queue Health</h3>
            <Badge
              variant={
                healthData.health_status === 'Healthy'
                  ? 'success'
                  : healthData.health_status === 'Warning'
                  ? 'warning'
                  : 'destructive'
              }
            >
              {healthData.health_status}
            </Badge>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Current Success Rate</h3>
            <p className="text-2xl font-bold">
              {healthData.metrics.success_rate.toFixed(2)}%
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Processing Time</h3>
            <p className="text-2xl font-bold">
              {healthData.metrics.average_processing_time.toFixed(2)}ms
            </p>
          </Card>
        </div>

        {/* Metrics Chart */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="h-[300px]">
            <Line data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </Card>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Pending</h3>
            <p className="text-2xl font-bold">{healthData.metrics.pending_count}</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Processing</h3>
            <p className="text-2xl font-bold">{healthData.metrics.processing_count}</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Failed</h3>
            <p className="text-2xl font-bold">{healthData.metrics.failed_count}</p>
          </Card>
        </div>

        {/* Recommendations */}
        {healthData.recommendations && healthData.recommendations.length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <ul className="list-disc pl-6">
              {healthData.recommendations.map((rec, i) => (
                <li key={i} className="text-gray-600 mb-2">
                  {rec}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Failed Emails */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Failed Emails</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueStatus.failed_emails.map(email => (
                <TableRow key={email.id}>
                  <TableCell>{email.to_email}</TableCell>
                  <TableCell>{email.subject}</TableCell>
                  <TableCell>{email.retries}</TableCell>
                  <TableCell>
                    {new Date(email.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(email.id)}
                      disabled={retryingEmails.has(email.id)}
                    >
                      {retryingEmails.has(email.id) ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Retrying...
                        </>
                      ) : (
                        'Retry'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
