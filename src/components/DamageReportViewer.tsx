import { useState, useCallback, useRef, useEffect } from 'react';
import { ReportUploader } from './ReportUploader';
import { ReportHeader } from './ReportHeader';
import { PhotoGallery } from './PhotoGallery';
import { DamageMap } from './DamageMap';
import type { DamageMapHandle } from './DamageMap';
import { ReportGenerator } from './ReportGenerator';
import { ApprovalControls } from './ApprovalControls';
import { MeasurementTools } from './MeasurementTools';
import { PhotoSet, GalleryType, DamageReportState, PhotoMetadata, PhotoSetApproval } from '@/types/damage-report';
import { processFolderStructure } from '@/utils/photo-processing';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ruler, Satellite, MousePointer2 } from 'lucide-react';

interface ReportMetrics {
  distanceMeters?: number;
  costAUD?: number;
}

export const DamageReportViewer = () => {
  const [state, setState] = useState<DamageReportState>({
    photoSets: [],
    currentSetIndex: 0,
    selectedPhotos: {},
    galleries: {
      precondition: { visible: true, rotation: 0, zoom: 1, panX: 0, panY: 0, candidatePhotos: [] },
      damage: { visible: true, rotation: 0, zoom: 1, panX: 0, panY: 0, candidatePhotos: [] },
      completion: { visible: true, rotation: 0, zoom: 1, panX: 0, panY: 0, candidatePhotos: [] }
    },
    searchTerm: '',
    mapVisible: true,
    approvals: {}
  });
const [isProcessing, setIsProcessing] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const mapRef = useRef<DamageMapHandle | null>(null);
  const [editorMode, setEditorMode] = useState(false);
  const [metricsById, setMetricsById] = useState<Record<string, ReportMetrics>>({});
  const [lastMeasuredDistance, setLastMeasuredDistance] = useState<number | null>(null);

  // Declare currentSet early to avoid temporal dead zone issues
  const currentSet = state.photoSets[state.currentSetIndex];

  useEffect(() => {
    const saved = localStorage.getItem('dm_editor_mode');
    if (saved === '1') setEditorMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('dm_editor_mode', editorMode ? '1' : '0');
  }, [editorMode]);

  const handleFilesSelected = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    try {
      const photoSets = await processFolderStructure(files);
      
      if (photoSets.length === 0) {
        toast.error('No valid damage reports found in the uploaded folder structure.');
        return;
      }

      // Initialize galleries with first photo set
      const firstSet = photoSets[0];
      const newState: DamageReportState = {
        photoSets,
        currentSetIndex: 0,
        selectedPhotos: {
          precondition: firstSet.preconditionPhotos[0],
          damage: firstSet.damagePhotos[0],
          completion: firstSet.completionPhotos[0]
        },
        galleries: {
          precondition: { 
            visible: true, 
            rotation: 0, 
            zoom: 1, 
            panX: 0, 
            panY: 0, 
            candidatePhotos: firstSet.preconditionPhotos,
            selectedPhoto: firstSet.preconditionPhotos[0]
          },
          damage: { 
            visible: true, 
            rotation: 0, 
            zoom: 1, 
            panX: 0, 
            panY: 0, 
            candidatePhotos: firstSet.damagePhotos,
            selectedPhoto: firstSet.damagePhotos[0]
          },
          completion: { 
            visible: true, 
            rotation: 0, 
            zoom: 1, 
            panX: 0, 
            panY: 0, 
            candidatePhotos: firstSet.completionPhotos,
            selectedPhoto: firstSet.completionPhotos[0]
          }
        },
        searchTerm: '',
        mapVisible: true,
        approvals: {}
      };

      setState(newState);
      toast.success(`Successfully processed ${photoSets.length} damage reports!`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process uploaded files. Please check the folder structure.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updateCurrentSet = useCallback((setIndex: number) => {
    if (setIndex < 0 || setIndex >= state.photoSets.length) return;

    const currentSet = state.photoSets[setIndex];
    setState(prev => ({
      ...prev,
      currentSetIndex: setIndex,
      selectedPhotos: {
        precondition: currentSet.preconditionPhotos[0],
        damage: currentSet.damagePhotos[0],
        completion: currentSet.completionPhotos[0]
      },
      galleries: {
        precondition: { 
          ...prev.galleries.precondition,
          candidatePhotos: currentSet.preconditionPhotos,
          selectedPhoto: currentSet.preconditionPhotos[0],
          rotation: 0,
          zoom: 1,
          panX: 0,
          panY: 0
        },
        damage: { 
          ...prev.galleries.damage,
          candidatePhotos: currentSet.damagePhotos,
          selectedPhoto: currentSet.damagePhotos[0],
          rotation: 0,
          zoom: 1,
          panX: 0,
          panY: 0
        },
        completion: { 
          ...prev.galleries.completion,
          candidatePhotos: currentSet.completionPhotos,
          selectedPhoto: currentSet.completionPhotos[0],
          rotation: 0,
          zoom: 1,
          panX: 0,
          panY: 0
        }
      }
    }));
  }, [state.photoSets]);

  const handleSearchChange = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const handlePreviousReport = useCallback(() => {
    updateCurrentSet(state.currentSetIndex - 1);
  }, [state.currentSetIndex, updateCurrentSet]);

  const handleNextReport = useCallback(() => {
    updateCurrentSet(state.currentSetIndex + 1);
  }, [state.currentSetIndex, updateCurrentSet]);

  const handleToggleGallery = useCallback((gallery: GalleryType, visible: boolean) => {
    setState(prev => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [gallery]: { ...prev.galleries[gallery], visible }
      }
    }));
  }, []);

  const handleOpenMapWindow = useCallback(() => {
    if (!currentSet) return;
    
    const mapWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!mapWindow) {
      toast.error('Failed to open map window. Please allow popups.');
      return;
    }

    mapWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Damage Assessment Map - ${currentSet.damageId}</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            #map { height: 100vh; width: 100vw; }
            .leaflet-container { background: #f8f9fa; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const photoData = ${JSON.stringify({
              damagePhotos: currentSet.damagePhotos,
              preconditionPhotos: currentSet.preconditionPhotos,
              completionPhotos: currentSet.completionPhotos,
              damageId: currentSet.damageId
            })};
            
            // Initialize map
            const map = L.map('map').setView([${currentSet.damagePhotos[0]?.location?.latitude || -37.8136}, ${currentSet.damagePhotos[0]?.location?.longitude || 144.9631}], 15);
            
            // Add tile layers
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Esri, Maxar, Earthstar Geographics'
            });
            
            // Create custom icons
            const createIcon = (color, type) => L.divIcon({
              html: \`<div style="background: \${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">\${type}</div>\`,
              className: 'custom-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            
            // Add markers
            let markerIndex = 1;
            [...photoData.damagePhotos, ...photoData.preconditionPhotos, ...photoData.completionPhotos].forEach((photo, index) => {
              if (photo.location?.latitude && photo.location?.longitude) {
                const isDamage = photoData.damagePhotos.includes(photo);
                const isPrecondition = photoData.preconditionPhotos.includes(photo);
                const color = isDamage ? '#ef4444' : isPrecondition ? '#f59e0b' : '#22c55e';
                const type = isDamage ? 'D' : isPrecondition ? 'P' : 'C';
                const label = isDamage ? \`D\${markerIndex++}\` : (isPrecondition ? 'PRE' : 'COM');
                
                L.marker([photo.location.latitude, photo.location.longitude], {
                  icon: createIcon(color, type)
                }).addTo(map).bindPopup(\`
                  <div style="min-width: 200px;">
                    <img src="\${photo.url}" style="width: 100%; height: 120px; object-fit: cover; margin-bottom: 8px; border-radius: 4px;" />
                    <p style="margin: 0; font-weight: bold;">\${label}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">\${photo.name}</p>
                  </div>
                \`);
              }
            });
            
            // Add controls
            const controlsDiv = L.control({position: 'topright'});
            controlsDiv.onAdd = function() {
              const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              div.innerHTML = \`
                <a href="#" onclick="toggleSatellite()" title="Toggle Satellite">🛰️</a>
                <a href="#" onclick="fitBounds()" title="Fit All Markers">📍</a>
              \`;
              return div;
            };
            controlsDiv.addTo(map);
            
            let usingSatellite = false;
            window.toggleSatellite = () => {
              if (usingSatellite) {
                map.removeLayer(satelliteLayer);
                map.addLayer(osmLayer);
              } else {
                map.removeLayer(osmLayer);
                map.addLayer(satelliteLayer);
              }
              usingSatellite = !usingSatellite;
            };
            
            window.fitBounds = () => {
              const allCoords = [...photoData.damagePhotos, ...photoData.preconditionPhotos, ...photoData.completionPhotos]
                .filter(p => p.location?.latitude && p.location?.longitude)
                .map(p => [p.location.latitude, p.location.longitude]);
              if (allCoords.length > 0) {
                map.fitBounds(allCoords, {padding: [20, 20]});
              }
            };
          </script>
        </body>
      </html>
    `);
    mapWindow.document.close();
    
    toast.success(`Map opened for ${currentSet.damageId}`);
  }, [currentSet]);

  const handlePhotoSelect = useCallback((gallery: GalleryType, photo: PhotoMetadata) => {
    setState(prev => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [gallery]: { ...prev.galleries[gallery], selectedPhoto: photo }
      },
      selectedPhotos: {
        ...prev.selectedPhotos,
        [gallery]: photo
      }
    }));
  }, []);

  const handleRotate = useCallback((gallery: GalleryType) => {
    setState(prev => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [gallery]: { 
          ...prev.galleries[gallery], 
          rotation: (prev.galleries[gallery].rotation + 90) % 360,
          panX: 0,
          panY: 0
        }
      }
    }));
  }, []);

  const handleZoomToggle = useCallback((gallery: GalleryType) => {
    setState(prev => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [gallery]: { 
          ...prev.galleries[gallery], 
          zoom: prev.galleries[gallery].zoom > 1 ? 1 : 2,
          panX: 0,
          panY: 0
        }
      }
    }));
  }, []);

  const handlePan = useCallback((gallery: GalleryType, deltaX: number, deltaY: number) => {
    setState(prev => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [gallery]: { 
          ...prev.galleries[gallery], 
          panX: deltaX,
          panY: deltaY
        }
      }
    }));
  }, []);

  const handleReset = useCallback(() => {
    setState({
      photoSets: [],
      currentSetIndex: 0,
      selectedPhotos: {},
      galleries: {
        precondition: { visible: true, rotation: 0, zoom: 1, panX: 0, panY: 0, candidatePhotos: [] },
        damage: { visible: true, rotation: 0, zoom: 1, panX: 0, panY: 0, candidatePhotos: [] },
        completion: { visible: true, rotation: 0, zoom: 1, panX: 0, panY: 0, candidatePhotos: [] }
      },
      searchTerm: '',
      mapVisible: true,
      approvals: {}
    });
  }, []);

  const handleApprovalChange = useCallback((damageId: string, approval: PhotoSetApproval) => {
    setState(prev => ({
      ...prev,
      approvals: {
        ...prev.approvals,
        [damageId]: approval
      }
    }));
    
    const statusText = approval.status === 'approved' ? 'Approved' : 
                      approval.status === 'rejected' ? 'Rejected' : 'Queried';
    toast.success(`Assessment updated: ${statusText} for ${damageId}`);
    
    // Force a re-render to ensure UI updates
    setTimeout(() => {
      setState(prev => ({ ...prev }));
    }, 100);
  }, []);

  const handleMetricsChange = useCallback((damageId: string, metrics: ReportMetrics) => {
    setMetricsById(prev => ({ ...prev, [damageId]: metrics }));
    try { localStorage.setItem(`dm_metrics_${damageId}`, JSON.stringify(metrics)); } catch {}
  }, []);

  const handleDistanceChange = useCallback((distance: number) => { setLastMeasuredDistance(distance); }, []);

  useEffect(() => {
    if (!currentSet) return;
    try {
      const raw = localStorage.getItem(`dm_metrics_${currentSet.damageId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMetricsById(prev => ({ ...prev, [currentSet.damageId]: parsed }));
      }
    } catch {}
  }, [currentSet?.damageId]);
  const galleryVisibility = {
    precondition: state.galleries.precondition.visible,
    damage: state.galleries.damage.visible,
    completion: state.galleries.completion.visible
  };

  const visibleGalleries = Object.values(galleryVisibility).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-2">
        {/* Upload Section or Header */}
        {state.photoSets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl">
              <ReportUploader 
                onFilesSelected={handleFilesSelected} 
                isProcessing={isProcessing} 
              />
            </div>
          </div>
        ) : (
          <>
            <ReportHeader
              photoSets={state.photoSets}
              currentSetIndex={state.currentSetIndex}
              searchTerm={state.searchTerm}
              onSearchChange={handleSearchChange}
              onPreviousReport={handlePreviousReport}
              onNextReport={handleNextReport}
              onToggleGallery={handleToggleGallery}
              galleryVisibility={galleryVisibility}
              onOpenMapWindow={handleOpenMapWindow}
              mapVisible={false}
              onReset={handleReset}
              onToggleReportGenerator={() => setShowReportGenerator(!showReportGenerator)}
              showReportGenerator={showReportGenerator}
            />
            
            {/* Inline Approval Controls */}
            {currentSet && (
              <ApprovalControls
                damageId={currentSet.damageId}
                approval={state.approvals[currentSet.damageId]}
                onApprovalChange={handleApprovalChange}
                metrics={metricsById[currentSet.damageId]}
                onMetricsChange={handleMetricsChange}
                lastMeasuredDistance={lastMeasuredDistance}
                selectedPhoto={state.selectedPhotos.damage ? {
                  url: state.selectedPhotos.damage.url,
                  name: state.selectedPhotos.damage.name
                } : undefined}
              />
            )}

            {/* Report Generator Modal */}
            <Dialog open={showReportGenerator} onOpenChange={setShowReportGenerator}>
              <DialogContent className="max-w-6xl sm:max-w-7xl z-[1200]">
                <DialogHeader>
                  <DialogTitle>Assessment Report Generator</DialogTitle>
                </DialogHeader>
                <ReportGenerator photoSets={state.photoSets} approvals={state.approvals} />
              </DialogContent>
            </Dialog>


            {/* Photo Galleries - Maximized for Assessment */}
            <div className={`grid gap-1 ${
              visibleGalleries === 1 ? 'grid-cols-1 h-[80vh]' :
              visibleGalleries === 2 ? 'grid-cols-2 h-[80vh]' : 
              'grid-cols-3 h-[75vh]'
            }`}>
              <PhotoGallery
                type="precondition"
                photos={state.galleries.precondition.candidatePhotos}
                selectedPhoto={state.galleries.precondition.selectedPhoto}
                onPhotoSelect={(photo) => handlePhotoSelect('precondition', photo)}
                rotation={state.galleries.precondition.rotation}
                zoom={state.galleries.precondition.zoom}
                panX={state.galleries.precondition.panX}
                panY={state.galleries.precondition.panY}
                onRotate={() => handleRotate('precondition')}
                onZoomToggle={() => handleZoomToggle('precondition')}
                onPan={(deltaX, deltaY) => handlePan('precondition', deltaX, deltaY)}
                visible={state.galleries.precondition.visible}
              />

              <PhotoGallery
                type="damage"
                photos={state.galleries.damage.candidatePhotos}
                selectedPhoto={state.galleries.damage.selectedPhoto}
                onPhotoSelect={(photo) => handlePhotoSelect('damage', photo)}
                rotation={state.galleries.damage.rotation}
                zoom={state.galleries.damage.zoom}
                panX={state.galleries.damage.panX}
                panY={state.galleries.damage.panY}
                onRotate={() => handleRotate('damage')}
                onZoomToggle={() => handleZoomToggle('damage')}
                onPan={(deltaX, deltaY) => handlePan('damage', deltaX, deltaY)}
                visible={state.galleries.damage.visible}
              />

              <PhotoGallery
                type="completion"
                photos={state.galleries.completion.candidatePhotos}
                selectedPhoto={state.galleries.completion.selectedPhoto}
                onPhotoSelect={(photo) => handlePhotoSelect('completion', photo)}
                rotation={state.galleries.completion.rotation}
                zoom={state.galleries.completion.zoom}
                panX={state.galleries.completion.panX}
                panY={state.galleries.completion.panY}
                onRotate={() => handleRotate('completion')}
                onZoomToggle={() => handleZoomToggle('completion')}
                onPan={(deltaX, deltaY) => handlePan('completion', deltaX, deltaY)}
                visible={state.galleries.completion.visible}
              />
            </div>
          </>
        )}
      </div>
      {/* Brand logo badge - non-interactive */}
      <img
        src="/lovable-uploads/d90971a8-7c57-4983-af58-e580d20396fe.png"
        alt="DCPM Damage Control Project Management logo"
        className="fixed bottom-3 right-3 h-10 opacity-90 pointer-events-none select-none drop-shadow-md"
        loading="lazy"
      />
    </div>
  );
};