import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, MessageSquare } from 'lucide-react';
import { PhotoSetApproval } from '@/types/damage-report';

interface ApprovalControlsProps {
  damageId: string;
  approval?: PhotoSetApproval;
  onApprovalChange: (damageId: string, approval: PhotoSetApproval) => void;
}

export const ApprovalControls = ({ damageId, approval, onApprovalChange }: ApprovalControlsProps) => {
  const [comments, setComments] = useState(approval?.comments || '');
  const [showComments, setShowComments] = useState(false);

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
    <Card className="p-4 bg-card border shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Assessment Status</h4>
          {approval && (
            <Badge variant="outline" className={`${getStatusColor(approval.status)} text-white border-none`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(approval.status)}
                <span className="capitalize">{approval.status}</span>
              </div>
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
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
        </div>

        {(showComments || approval?.comments) && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add assessment comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[80px] resize-none"
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

        {approval?.timestamp && (
          <div className="text-xs text-muted-foreground">
            Last updated: {approval.timestamp.toLocaleDateString()} {approval.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );
};