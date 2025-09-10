import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, HelpCircle, MessageSquare, FileText, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AssessmentForm } from './AssessmentForm';
import { PhotoAnnotation } from './PhotoAnnotation';
import { CompleteAssessment } from '@/types/assessment-fields';
import { PhotoSetApproval } from '@/types/damage-report';

interface ReportMetrics {
  distanceMeters?: number;
  costAUD?: number;
}

interface ApprovalControlsProps {
  damageId: string;
  approval?: PhotoSetApproval;
  onApprovalChange: (damageId: string, approval: PhotoSetApproval) => void;
  metrics?: ReportMetrics;
  onMetricsChange?: (damageId: string, metrics: ReportMetrics) => void;
  lastMeasuredDistance?: number | null;
  selectedPhoto?: { url: string; name: string };
}

export const ApprovalControls = ({ damageId, approval, onApprovalChange, metrics, onMetricsChange, lastMeasuredDistance, selectedPhoto }: ApprovalControlsProps) => {
  const [comments, setComments] = useState(approval?.comments || '');
  const [showComments, setShowComments] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [distance, setDistance] = useState<string>(metrics?.distanceMeters != null ? String(metrics.distanceMeters) : '');
  const [cost, setCost] = useState<string>(metrics?.costAUD != null ? String(metrics.costAUD) : '');
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showPhotoAnnotation, setShowPhotoAnnotation] = useState(false);
  const [assessment, setAssessment] = useState<Partial<CompleteAssessment>>();

  useEffect(() => {
    setDistance(metrics?.distanceMeters != null ? String(metrics.distanceMeters) : '');
    setCost(metrics?.costAUD != null ? String(metrics.costAUD) : '');
  }, [metrics?.distanceMeters, metrics?.costAUD]);

  const emitMetrics = (dStr: string, cStr: string) => {
    const d = parseFloat(dStr);
    const c = parseFloat(cStr);
    onMetricsChange?.(damageId, {
      distanceMeters: Number.isFinite(d) ? d : undefined,
      costAUD: Number.isFinite(c) ? c : undefined,
    });
  };

  const handleStatusChange = (status: PhotoSetApproval['status']) => {
    const newApproval: PhotoSetApproval = {
      status,
      comments,
      timestamp: new Date()
    };
    onApprovalChange(damageId, newApproval);
  };

  const handleCommentsSubmit = () => {
    if (approval) {
      const updatedApproval: PhotoSetApproval = {
        ...approval,
        comments,
        timestamp: new Date()
      };
      onApprovalChange(damageId, updatedApproval);
    }
    setShowComments(false);
  };

  const getStatusColor = (status: PhotoSetApproval['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'query': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: PhotoSetApproval['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'query': return <HelpCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card className="p-2 bg-card border shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-foreground">Assessment Status</h4>
          {approval && (
            <Badge variant="outline" className={`${getStatusColor(approval.status)} text-white border-none`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(approval.status)}
                <span className="capitalize">{approval.status}</span>
              </div>
            </Badge>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('approved')}
            className={`flex-1 ${approval?.status === 'approved' ? 'bg-green-500 text-white border-green-500' : 'hover:bg-green-50 hover:border-green-300'}`}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('query')}
            className={`flex-1 ${approval?.status === 'query' ? 'bg-yellow-500 text-white border-yellow-500' : 'hover:bg-yellow-50 hover:border-yellow-300'}`}
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Query
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('rejected')}
            className={`flex-1 ${approval?.status === 'rejected' ? 'bg-red-500 text-white border-red-500' : 'hover:bg-red-50 hover:border-red-300'}`}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={`${showComments || approval?.comments ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-blue-50 hover:border-blue-300'}`}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          <Dialog open={showAssessmentForm} onOpenChange={setShowAssessmentForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300">
                <FileText className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Professional Assessment Form</DialogTitle>
              </DialogHeader>
              <AssessmentForm
                damageId={damageId}
                onAssessmentChange={setAssessment}
                initialAssessment={assessment}
              />
            </DialogContent>
          </Dialog>

          {selectedPhoto && (
            <Dialog open={showPhotoAnnotation} onOpenChange={setShowPhotoAnnotation}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300">
                  <Camera className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Annotate Photo: {selectedPhoto.name}</DialogTitle>
                </DialogHeader>
                <PhotoAnnotation
                  imageUrl={selectedPhoto.url}
                  onAnnotationsChange={(annotations) => {
                    // Save annotations for this photo
                    localStorage.setItem(`annotations_${damageId}_${selectedPhoto.name}`, JSON.stringify(annotations));
                  }}
                  initialAnnotations={(() => {
                    try {
                      const saved = localStorage.getItem(`annotations_${damageId}_${selectedPhoto.name}`);
                      return saved ? JSON.parse(saved) : [];
                    } catch {
                      return [];
                    }
                  })()}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {(showComments || approval?.comments) && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add assessment comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[64px] resize-none"
            />
            {showComments && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCommentsSubmit}>
                  Save Comments
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowComments(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

<Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">Details</span>
    <CollapsibleTrigger asChild>
      <Button variant="outline" size="sm">{detailsOpen ? 'Hide' : 'Show'}</Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent className="mt-2">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div>
        <label className="text-xs text-muted-foreground">Distance (m)</label>
        <div className="flex gap-2 mt-1">
          <Input
            inputMode="decimal"
            placeholder="e.g. 12.5"
            value={distance}
            onChange={(e) => { setDistance(e.target.value); emitMetrics(e.target.value, cost); }}
          />
          {typeof lastMeasuredDistance === 'number' && distance === '' && (
            <Button type="button" variant="secondary" size="sm" onClick={() => { const v = String(lastMeasuredDistance.toFixed(1)); setDistance(v); emitMetrics(v, cost); }}>
              Use
            </Button>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Cost (AUD)</label>
        <Input
          inputMode="decimal"
          placeholder="e.g. 1500"
          value={cost}
          onChange={(e) => { setCost(e.target.value); emitMetrics(distance, e.target.value); }}
          className="mt-1"
        />
      </div>
      <div className="hidden sm:block" />
    </div>
  </CollapsibleContent>
</Collapsible>

{approval?.timestamp && (
  <div className="text-xs text-muted-foreground">
    Last updated: {approval.timestamp.toLocaleDateString()} {approval.timestamp.toLocaleTimeString()}
  </div>
)}
      </div>
    </Card>
  );
};