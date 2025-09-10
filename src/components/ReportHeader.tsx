import { Search, ChevronLeft, ChevronRight, MapPin, Eye, EyeOff, ArrowLeft, FileSpreadsheet, Zap, HelpCircle, Camera, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoSet, GalleryType } from '@/types/damage-report';

interface ReportHeaderProps {
  photoSets: PhotoSet[];
  currentSetIndex: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onPreviousReport: () => void;
  onNextReport: () => void;
  onToggleGallery: (gallery: GalleryType, visible: boolean) => void;
  galleryVisibility: Record<GalleryType, boolean>;
  onOpenMapWindow: () => void;
  mapVisible: boolean;
  onReset: () => void;
  onToggleReportGenerator: () => void;
  showReportGenerator: boolean;
  showRecommendations?: boolean;
  onToggleRecommendations?: () => void;
  showUserGuide?: boolean;
  onToggleUserGuide?: () => void;
  manualMode?: boolean;
  onToggleManualMode?: () => void;
}

export const ReportHeader = ({
  photoSets,
  currentSetIndex,
  searchTerm,
  onSearchChange,
  onPreviousReport,
  onNextReport,
  onToggleGallery,
  galleryVisibility,
  onOpenMapWindow,
  mapVisible,
  onReset,
  onToggleReportGenerator,
  showReportGenerator,
  showRecommendations = false,
  onToggleRecommendations,
  showUserGuide = false,
  onToggleUserGuide,
  manualMode = false,
  onToggleManualMode
}: ReportHeaderProps) => {
  const currentSet = photoSets[currentSetIndex];
  const filteredSets = photoSets.filter(set => 
    set.damageId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-2 bg-gradient-header text-primary-foreground shadow-card">
      <div className="flex flex-col gap-2">
        {/* Top row: Title and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold">DCPM Damage Assessment Tool</h1>
          </div>
          
          <div className="flex gap-2">
            {onToggleManualMode && (
              <Button
                variant={manualMode ? "default" : "outline"}
                size="sm"
                onClick={onToggleManualMode}
                className="shrink-0"
              >
                {manualMode ? <Edit3 className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                {manualMode ? 'Manual Mode' : 'Auto Mode'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMapWindow}
              className="shrink-0"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open Map
            </Button>
            
            {onToggleUserGuide && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleUserGuide}
                className={`shrink-0 ${showUserGuide ? 'bg-primary/10 border-primary' : ''}`}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                User Guide
              </Button>
            )}
            
            {onToggleRecommendations && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleRecommendations}
                className={`shrink-0 ${showRecommendations ? 'bg-primary/10 border-primary' : ''}`}
              >
                <Zap className="w-4 h-4 mr-2" />
                {showRecommendations ? 'Hide Features' : 'Feature Ideas'}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleReportGenerator}
              className={`text-primary-foreground hover:bg-primary-foreground/20 ${showReportGenerator ? 'bg-primary-foreground/20' : ''}`}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {showReportGenerator ? 'Hide Report' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Middle row: Search and navigation */}
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search damage reports..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/70"
            />
          </div>

          {currentSet && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreviousReport}
                disabled={currentSetIndex === 0}
                className="text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <span className="text-sm font-medium px-3 py-1 bg-primary-foreground/20 rounded">
                {currentSetIndex + 1} of {filteredSets.length}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onNextReport}
                disabled={currentSetIndex === photoSets.length - 1}
                className="text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Bottom row: Current report info and gallery toggles */}
        {currentSet && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Report: {currentSet.damageId}</h2>
              <div className="text-sm text-primary-foreground/80 flex gap-4">
                <span>Damage: {currentSet.damagePhotos.length} photos</span>
                <span>Precondition: {currentSet.preconditionPhotos.length} photos</span>
                <span>Completion: {currentSet.completionPhotos.length} photos</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Gallery View:</span>
              {(['precondition', 'damage', 'completion'] as GalleryType[]).map((gallery) => (
                <div key={gallery} className="flex items-center gap-2">
                  <Checkbox
                    id={`gallery-${gallery}`}
                    checked={galleryVisibility[gallery]}
                    onCheckedChange={(checked) => onToggleGallery(gallery, checked as boolean)}
                    className="border-primary-foreground/30 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                  />
                  <label 
                    htmlFor={`gallery-${gallery}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {gallery}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};