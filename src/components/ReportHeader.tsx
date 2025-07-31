import { Search, ChevronLeft, ChevronRight, Map, Eye, EyeOff } from 'lucide-react';
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
  onToggleMap: () => void;
  mapVisible: boolean;
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
  onToggleMap,
  mapVisible
}: ReportHeaderProps) => {
  const currentSet = photoSets[currentSetIndex];
  const filteredSets = photoSets.filter(set => 
    set.damageId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-4 bg-gradient-header text-primary-foreground shadow-card">
      <div className="flex flex-col gap-4">
        {/* Top row: Title and Map toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold">DCPM Damage Report Viewer</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMap}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Map className="w-4 h-4 mr-2" />
            {mapVisible ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>

        {/* Middle row: Search and navigation */}
        <div className="flex items-center gap-4">
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
              <h2 className="text-lg font-semibold">Report: {currentSet.damageId}</h2>
              <div className="text-sm text-primary-foreground/80 flex gap-4">
                <span>Damage: {currentSet.damagePhotos.length} photos</span>
                <span>Precondition: {currentSet.preconditionPhotos.length} photos</span>
                <span>Completion: {currentSet.completionPhotos.length} photos</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
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