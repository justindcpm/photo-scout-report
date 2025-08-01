import { useState, useRef, useCallback } from 'react';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
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

  if (!visible) return null;

  return (
    <Card className="flex-1 bg-gradient-gallery shadow-gallery overflow-hidden">
      {/* Compact Header */}
      <div className={`p-2 border-b bg-${getTypeColor(type)} text-${getTypeColor(type)}-foreground`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm capitalize">{type}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="tool"
              onClick={onRotate}
              className={`text-${getTypeColor(type)}-foreground hover:bg-${getTypeColor(type)}-foreground/20 h-6 w-6 p-1`}
              title="Rotate 90°"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="tool"
              onClick={onZoomToggle}
              className={`text-${getTypeColor(type)}-foreground hover:bg-${getTypeColor(type)}-foreground/20 h-6 w-6 p-1`}
              title={zoom > 1 ? "Zoom Out" : "Zoom In"}
            >
              {zoom > 1 ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
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

        {/* Compact Photo Info */}
        {selectedPhoto && (
          <div className="p-1 bg-background/50 backdrop-blur-sm border-t">
            <p className="text-xs text-muted-foreground truncate" title={selectedPhoto.name}>
              {selectedPhoto.name}
            </p>
          </div>
        )}

        {/* Compact Thumbnail Strip */}
        <div className="p-2 border-t bg-background/30">
          <div className="flex gap-1 overflow-x-auto gallery-scroll">
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <button
                  key={photo.name}
                  onClick={() => onPhotoSelect(photo)}
                  className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-smooth ${
                    selectedPhoto?.name === photo.name 
                      ? `border-${getTypeColor(type)} shadow-md` 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  title={photo.name}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            ) : (
              <div className="flex-1 text-center py-2">
                <p className="text-xs text-muted-foreground">No {type} photos</p>
              </div>
            )}
          </div>
          
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};