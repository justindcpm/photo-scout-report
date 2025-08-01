import { useState } from 'react';
import { Download, FileSpreadsheet, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PhotoSet } from '@/types/damage-report';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  photoSets: PhotoSet[];
}

type ReportStatus = 'pending' | 'checked' | 'needs-review';

interface ReportData {
  setId: string;
  status: ReportStatus;
  comments: string;
}

export const ReportGenerator = ({ photoSets }: ReportGeneratorProps) => {
  const [reportData, setReportData] = useState<Record<string, ReportData>>({});
  const [globalComments, setGlobalComments] = useState('');

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'checked': return 'bg-green-500';
      case 'needs-review': return 'bg-yellow-500'; 
      case 'pending': return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case 'checked': return 'Checked';
      case 'needs-review': return 'Needs Review';
      case 'pending': return 'Pending';
    }
  };

  const updateReportStatus = (setId: string, status: ReportStatus) => {
    setReportData(prev => ({
      ...prev,
      [setId]: { ...prev[setId], setId, status, comments: prev[setId]?.comments || '' }
    }));
  };

  const updateReportComments = (setId: string, comments: string) => {
    setReportData(prev => ({
      ...prev,
      [setId]: { ...prev[setId], setId, status: prev[setId]?.status || 'pending', comments }
    }));
  };

  const generateExcelReport = () => {
    const worksheetData = photoSets.map(photoSet => {
      const data = reportData[photoSet.damageId] || { status: 'pending', comments: '' };
      return {
        'Report ID': photoSet.damageId,
        'Folder Path': photoSet.damageId,
        'Status': getStatusLabel(data.status),
        'Precondition Photos': photoSet.preconditionPhotos.length,
        'Damage Photos': photoSet.damagePhotos.length,
        'Completion Photos': photoSet.completionPhotos.length,
        'Total Photos': photoSet.preconditionPhotos.length + photoSet.damagePhotos.length + photoSet.completionPhotos.length,
        'Comments': data.comments,
        'Generated Date': new Date().toLocaleDateString(),
        'Generated Time': new Date().toLocaleTimeString()
      };
    });

    // Add summary row
    const totalReports = photoSets.length;
    const checkedCount = Object.values(reportData).filter(r => r.status === 'checked').length;
    const reviewCount = Object.values(reportData).filter(r => r.status === 'needs-review').length;
    const pendingCount = totalReports - checkedCount - reviewCount;

    worksheetData.unshift({
      'Report ID': 'SUMMARY',
      'Folder Path': `Total Reports: ${totalReports}`,
      'Status': `Checked: ${checkedCount}, Review: ${reviewCount}, Pending: ${pendingCount}`,
      'Precondition Photos': 0,
      'Damage Photos': 0,
      'Completion Photos': 0,
      'Total Photos': 0,
      'Comments': globalComments,
      'Generated Date': '',
      'Generated Time': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Damage Assessment Report');

    // Auto-size columns
    const cols = [
      { wch: 15 }, // Report ID
      { wch: 30 }, // Folder Path
      { wch: 15 }, // Status
      { wch: 12 }, // Precondition
      { wch: 12 }, // Damage
      { wch: 12 }, // Completion
      { wch: 12 }, // Total
      { wch: 40 }, // Comments
      { wch: 12 }, // Date
      { wch: 12 }  // Time
    ];
    worksheet['!cols'] = cols;

    const fileName = `damage_assessment_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Excel report generated successfully!');
  };

  const getCompletionStats = () => {
    const total = photoSets.length;
    const checked = Object.values(reportData).filter(r => r.status === 'checked').length;
    const review = Object.values(reportData).filter(r => r.status === 'needs-review').length;
    const pending = total - checked - review;
    
    return { total, checked, review, pending };
  };

  const stats = getCompletionStats();

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Assessment Report Generator</h2>
        </div>
        <Button onClick={generateExcelReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Generate Excel Report
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Reports</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.checked}</div>
          <div className="text-sm text-muted-foreground">Checked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.review}</div>
          <div className="text-sm text-muted-foreground">Needs Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
      </div>

      {/* Global Comments */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Global Assessment Comments
        </label>
        <Textarea
          placeholder="Enter general comments about this assessment session..."
          value={globalComments}
          onChange={(e) => setGlobalComments(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Report List */}
      <div className="space-y-4">
        <h3 className="font-medium">Individual Report Status</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {photoSets.map((photoSet) => {
            const data = reportData[photoSet.damageId] || { status: 'pending', comments: '' };
            return (
              <div key={photoSet.damageId} className="flex items-start gap-4 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-medium truncate" title={photoSet.damageId}>
                      {photoSet.damageId}
                    </div>
                    <Badge className={getStatusColor(data.status)}>
                      {getStatusLabel(data.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate" title={photoSet.damageId}>
                    {photoSet.damageId}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {photoSet.preconditionPhotos.length + photoSet.damagePhotos.length + photoSet.completionPhotos.length} photos
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <Select
                    value={data.status}
                    onValueChange={(value: ReportStatus) => updateReportStatus(photoSet.damageId, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="checked">Checked</SelectItem>
                      <SelectItem value="needs-review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Textarea
                    placeholder="Add comments..."
                    value={data.comments}
                    onChange={(e) => updateReportComments(photoSet.damageId, e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};