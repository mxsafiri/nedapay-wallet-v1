'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';
import { DocumentPreviewModal } from '@/components/admin/compliance/DocumentPreviewModal';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

interface KYCRequest {
  id: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  documentType: 'id_card' | 'passport' | 'drivers_license';
  documentId: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function CompliancePage() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);

  const { data: kycRequests, isLoading, refetch } = useQuery<KYCRequest[]>({
    queryKey: ['kyc-requests'],
    queryFn: () => api.get('/admin/compliance/kyc-requests').then(res => res.data),
  });

  const handleVerification = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/compliance/kyc-requests/${requestId}/${action}`);
      toast({
        title: 'KYC Request Updated',
        description: `Successfully ${action}ed the KYC request`,
        variant: 'default',
      });
      setSelectedRequest(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update KYC request',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: KYCRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">KYC Verification</h2>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.userEmail}</div>
                      <div className="text-sm text-muted-foreground">ID: {request.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {request.documentType.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    {new Date(request.submittedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <Badge
                        variant={
                          request.status === 'approved'
                            ? 'success'
                            : request.status === 'rejected'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerification(request.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerification(request.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!kycRequests?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No pending KYC requests
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {selectedRequest && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          documentId={selectedRequest.documentId}
          documentType={selectedRequest.documentType}
          userId={selectedRequest.userId}
          onApprove={() => handleVerification(selectedRequest.id, 'approve')}
          onReject={() => handleVerification(selectedRequest.id, 'reject')}
        />
      )}
    </div>
  );
}
