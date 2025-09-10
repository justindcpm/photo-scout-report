import { useState, useRef, useCallback } from 'react';
import { RotateCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhotoMetadata, GalleryType } from '@/types/damage-report';
import { getImageZoomTransform } from '@/utils/photo-processing';

interface PhotoGalleryProps {
  type: GalleryType;
  photos: PhotoMetadata[];
  selectedPhoto?: PhotoMetadata;
  onPhotoSelect: (photo: PhotoMetadata) => void;
  rotation: number;
  zoom: number;
  panX: number;
  panY: number;
  onRotate: () => void;
  onZoomToggle: () => void;
  onPan: (deltaX: number, deltaY: number) => void;
  visible: boolean;
}

export const PhotoGallery = ({
  type,
  photos,
  selectedPhoto,
  onPhotoSelect,
  rotation,
  zoom,
  panX,
  panY,
  onRotate,
  onZoomToggle,
  onPan,
  visible
}: PhotoGalleryProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const getTypeColor = (type: GalleryType) => {
    switch (type) {
      case 'precondition': return 'precondition';
      case 'damage': return 'damage';
      case 'completion': return 'completion';
      default: return 'primary';
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [zoom, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onPan(deltaX, deltaY);
    }
  }, [isDragging, zoom, dragStart, onPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getCurrentPhotoIndex = () => {
    if (!selectedPhoto) return -1;
    return photos.findIndex(photo => photo.name === selectedPhoto.name);
  };

  const handlePreviousPhoto = () => {
    const currentIndex = getCurrentPhotoIndex();
    if (currentIndex > 0) {
      onPhotoSelect(photos[currentIndex - 1]);
    }
  };

  const handleNextPhoto = () => {
    const currentIndex = getCurrentPhotoIndex();
    if (currentIndex < photos.length - 1) {
      onPhotoSelect(photos[currentIndex + 1]);
    }
  };

  if (!visible) return null;

  return (
    <Card className="flex-1 bg-gradient-gallery shadow-gallery overflow-hidden border-0 rounded-lg">
      {/* Ultra Compact Header */}
      <div className={`p-1 border-b bg-${getTypeColor(type)} text-${getTypeColor(type)}-foreground`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs uppercase tracking-wide">{type}</h3>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="tool"
              onClick={handlePreviousPhoto}
              disabled={getCurrentPhotoIndex() <= 0}
              className={`text-${getTypeColor(type)}-foreground hover:bg-${getTypeColor(type)}-foreground/20 h-5 w-5 p-0.5 disabled:opacity-50`}
              title="Previous Photo"
            >
              <ChevronLeft className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="tool"
              onClick={handleNextPhoto}
              disabled={getCurrentPhotoIndex() >= photos.length - 1}
              className={`text-${getTypeColor(type)}-foreground hover:bg-${getTypeColor(type)}-foreground/20 h-5 w-5 p-0.5 disabled:opacity-50`}
              title="Next Photo"
            >
              <ChevronRight className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="tool"
              onClick={onRotate}
              className={`text-${getTypeColor(type)}-foreground hover:bg-${getTypeColor(type)}-foreground/20 h-5 w-5 p-0.5`}
              title="Rotate 90°"
            >
              <RotateCw className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="tool"
              onClick={onZoomToggle}
              className={`text-${getTypeColor(type)}-foreground hover:bg-${getTypeColor(type)}-foreground/20 h-5 w-5 p-0.5`}
              title={zoom > 1 ? "Zoom Out" : "Zoom In"}
            >
              {zoom > 1 ? <ZoomOut className="w-2.5 h-2.5" /> : <ZoomIn className="w-2.5 h-2.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Photo Display */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 bg-muted/20 overflow-hidden relative">
          {selectedPhoto ? (
            <div 
              className={`w-full h-full flex items-center justify-center photo-container ${zoom > 1 ? 'zoomed' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                className="max-w-full max-h-full object-contain transition-photo"
                style={{
                  transform: getImageZoomTransform(zoom, panX, panY, rotation),
                  transformOrigin: 'center center'
                }}
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <ZoomIn className="w-8 h-8" />
                </div>
                <p>No photo selected</p>
                <p className="text-sm">Click a thumbnail below to view</p>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Thumbnail Strip - Bottom Only */}
        <div className="p-1 border-t bg-background/20 backdrop-blur-sm">
          <div className="flex gap-1 overflow-x-auto gallery-scroll" style={{ scrollbarWidth: 'thin' }}>
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <button
                  key={photo.name}
                  onClick={() => onPhotoSelect(photo)}
                  className={`flex-shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] rounded overflow-hidden border transition-smooth ${
                    selectedPhoto?.name === photo.name 
                      ? `border-2 border-${getTypeColor(type)} shadow-lg ring-1 ring-${getTypeColor(type)}/50` 
                      : 'border border-border/50 hover:border-muted-foreground hover:shadow-md'
                  }`}
                  title={`${photo.name} (${index + 1}/${photos.length})`}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))
            ) : (
              <div className="flex-1 text-center py-1">
                <p className="text-xs text-muted-foreground/70">No {type} photos</p>
              </div>
            )}
          </div>
          
          {photos.length > 0 && selectedPhoto && (
            <div className="flex items-center justify-center mt-1">
              <p className="text-xs text-muted-foreground/80 font-medium">
                {getCurrentPhotoIndex() + 1} / {photos.length}
                {selectedPhoto && (
                  <span className="ml-2 text-muted-foreground/60 font-normal truncate max-w-[120px] inline-block">
                    {selectedPhoto.name.split('.')[0]}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};