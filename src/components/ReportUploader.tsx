import { useRef } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ReportUploaderProps {
  onFilesSelected: (files: FileList) => void;
  isProcessing: boolean;
}

export const ReportUploader = ({ onFilesSelected, isProcessing }: ReportUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
      toast.success(`Processing ${files.length} files...`);
    }
  };

  return (
    <Card className="p-6 border-2 border-dashed border-border hover:border-primary/50 transition-smooth bg-gradient-card shadow-card">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-header rounded-full flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Upload Damage Report Folders</h3>
          <p className="text-muted-foreground text-sm">
            Select the main folder containing damage reports with the expected structure:<br />
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              [Main Folder] / [Damage ID] / [Photo Type] / [Images]
            </code>
          </p>
        </div>

        <Button 
          onClick={handleFileSelect}
          disabled={isProcessing}
          variant="professional"
          size="lg"
          className="w-full max-w-xs"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Select Folder
            </>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          {...({ webkitdirectory: "" } as any)}
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    </Card>
  );
};