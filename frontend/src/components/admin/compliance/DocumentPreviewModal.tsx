'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: string;
  userId: string;
  onApprove: () => void;
  onReject: () => void;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  documentId,
  documentType,
  userId,
  onApprove,
  onReject,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  // Secure document URL with temporary signed access
  const documentUrl = `/api/admin/compliance/documents/${documentId}`;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Document Verification</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mb-2">
              <span>User ID: {userId}</span>
              <Badge variant="outline" className="capitalize">
                {documentType.replace('_', ' ')}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[400px] bg-muted rounded-md overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          
          <img
            src={documentUrl}
            alt="Verification Document"
            className="w-full h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out',
            }}
            onLoad={() => setLoading(false)}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onReject}
            >
              Reject
            </Button>
            <Button
              variant="default"
              onClick={onApprove}
            >
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
