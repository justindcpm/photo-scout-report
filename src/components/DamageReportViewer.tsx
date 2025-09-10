import { useState, useCallback, useRef, useEffect } from 'react';
import { ReportUploader } from './ReportUploader';
import { ReportHeader } from './ReportHeader';
import { PhotoGallery } from './PhotoGallery';
import { DamageMap } from './DamageMap';
import type { DamageMapHandle } from './DamageMap';
import { ReportGenerator } from './ReportGenerator';
import { ApprovalControls } from './ApprovalControls';
import { UserGuide } from './UserGuide';
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
  
  const [manualMode, setManualMode] = useState(false);
  const [setMode, setSetMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const mapRef = useRef<DamageMapHandle | null>(null);
  const [editorMode, setEditorMode] = useState(false);
  const [metricsById, setMetricsById] = useState<Record<string, ReportMetrics>>({});
  const [lastMeasuredDistance, setLastMeasuredDistance] = useState<number | null>(null);

  const [mapWindow, setMapWindow] = useState<Window | null>(null);

  const currentSet = state.photoSets[state.currentSetIndex];

  // Enhanced map window with real-time highlighting
  // Update map window when selected photo changes
  useEffect(() => {
    if (!mapWindow || mapWindow.closed) return;
    
    const currentSelectedPhoto = state.galleries.damage.selectedPhoto || 
                                state.galleries.precondition.selectedPhoto || 
                                state.galleries.completion.selectedPhoto;
    
    if (currentSelectedPhoto) {
      try {
        mapWindow.postMessage({
          type: 'HIGHLIGHT_PHOTO',
          photoName: currentSelectedPhoto.name,
          photoUrl: currentSelectedPhoto.url
        }, '*');
      } catch (error) {
        console.log('Map window communication error:', error);
      }
    }
  }, [
    state.galleries.damage.selectedPhoto,
    state.galleries.precondition.selectedPhoto,
    state.galleries.completion.selectedPhoto,
    mapWindow
  ]);

  // Update map window when currentSet changes (switching between folders)
  useEffect(() => {
    if (!mapWindow || mapWindow.closed || !currentSet) return;
    
    try {
      mapWindow.postMessage({
        type: 'UPDATE_SET_DATA',
        photoData: {
          damagePhotos: currentSet.damagePhotos,
          preconditionPhotos: currentSet.preconditionPhotos,
          completionPhotos: currentSet.completionPhotos,
          damageId: currentSet.damageId
        }
      }, '*');
      
      console.log('Sent map update for:', currentSet.damageId);
    } catch (error) {
      console.log('Map window communication error:', error);
    }
  }, [currentSet, mapWindow]);

  // Get currently highlighted photo for map synchronization
  const getHighlightedPhoto = () => {
    return state.galleries.damage.selectedPhoto || 
           state.galleries.precondition.selectedPhoto || 
           state.galleries.completion.selectedPhoto;
  };

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
    console.log('Switching to damage report set:', currentSet.damageId);
    
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
    
    console.log('Opening map window for:', currentSet.damageId);
    
    const newMapWindow = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    if (!newMapWindow) {
      toast.error('Failed to open map window. Please allow popups.');
      return;
    }

    setMapWindow(newMapWindow);

    try {
      newMapWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Damage Assessment Map - ${currentSet.damageId}</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #f1f5f9; }
            #map { height: calc(100vh - 60px); width: 100vw; }
            .map-header { 
              height: 60px; 
              background: linear-gradient(135deg, #1e293b, #334155); 
              color: white; 
              display: flex; 
              align-items: center; 
              justify-content: space-between; 
              padding: 0 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .map-title { font-size: 18px; font-weight: bold; }
            .map-tools { display: flex; gap: 10px; }
            .tool-btn { 
              background: rgba(255,255,255,0.2); 
              border: 1px solid rgba(255,255,255,0.3); 
              color: white; 
              padding: 8px 16px; 
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 14px;
              transition: all 0.3s ease;
            }
            .tool-btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-1px); }
            .tool-btn.active { background: rgba(59, 130, 246, 0.8); }
            .filter-group { display: flex; align-items: center; gap: 8px; }
            .filter-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); margin-right: 4px; }
            .filter-btn { 
              background: rgba(255,255,255,0.2); 
              border: 1px solid rgba(255,255,255,0.3); 
              color: white; 
              padding: 6px 12px; 
              border-radius: 4px; 
              cursor: pointer; 
              font-size: 11px;
              font-weight: 600;
              transition: all 0.3s ease;
            }
            .filter-btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-1px); }
            .filter-btn.active { background: rgba(34, 197, 94, 0.8); border-color: rgba(34, 197, 94, 1); }
            .filter-btn.inactive { background: rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 1); opacity: 0.7; }
            .tool-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.3); margin: 0 8px; }
            .leaflet-container { background: #f8fafc; }
            .legend { 
              position: absolute; 
              bottom: 20px; 
              left: 20px; 
              background: white; 
              padding: 15px; 
              border-radius: 8px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              font-size: 12px;
              z-index: 1000;
            }
            .legend-item { display: flex; align-items: center; margin-bottom: 8px; }
            .legend-item:last-child { margin-bottom: 0; }
            .legend-marker { width: 20px; height: 20px; margin-right: 10px; border-radius: 50%; }
            .distance-display {
              position: absolute;
              top: 70px;
              right: 20px;
              background: white;
              padding: 10px 15px;
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              font-weight: bold;
              z-index: 1000;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.15); opacity: 0.8; }
            }
            .highlighted-marker {
              animation: pulse 2s infinite;
            }
          </style>
        </head>
        <body>
            <div class="map-header">
              <div class="map-title">📍 ${currentSet.damageId} - Interactive Assessment Map</div>
              <div class="map-tools">
                <div class="filter-group">
                  <span class="filter-label">Show:</span>
                  <button class="filter-btn active" onclick="toggleFilter('damage')" id="damageFilter" title="Toggle Damage Markers">🔴 Damage</button>
                  <button class="filter-btn active" onclick="toggleFilter('precondition')" id="preconditionFilter" title="Toggle Precondition Markers">🟢 Pre</button>
                  <button class="filter-btn active" onclick="toggleFilter('completion')" id="completionFilter" title="Toggle Completion Markers">🟡 Com</button>
                </div>
                <div class="tool-divider"></div>
                <button class="tool-btn" onclick="toggleSatellite()" title="Toggle Satellite View">🛰️ Satellite</button>
                <button class="tool-btn" onclick="startMeasurement()" title="Measure Distance" id="measureBtn">📏 Measure</button>
                <button class="tool-btn" onclick="clearMeasurements()" title="Clear All Measurements">🗑️ Clear</button>
                <button class="tool-btn" onclick="fitBounds()" title="Fit All Markers">🎯 Fit View</button>
              </div>
            </div>
          <div id="map"></div>
          <div class="legend">
            <h4 style="margin: 0 0 10px 0; font-size: 14px;">Map Legend</h4>
            <div class="legend-item">
              <div class="legend-marker" style="background: #ef4444; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">1</div>
              Damage Points (numbered)
            </div>
            <div class="legend-item">
              <div class="legend-marker" style="background: #22c55e; width: 30px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">PRE</div>
              Precondition
            </div>
            <div class="legend-item">
              <div class="legend-marker" style="background: #eab308; width: 30px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">COM</div>
              Completion
            </div>
          </div>
          <div class="distance-display" id="distanceDisplay" style="display: none;">
            <div>Distance: <span id="distanceValue">0</span>m</div>
          </div>
          
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            console.log('Map initialization started');
            
            const photoData = ${JSON.stringify({
              damagePhotos: currentSet.damagePhotos,
              preconditionPhotos: currentSet.preconditionPhotos,
              completionPhotos: currentSet.completionPhotos,
              damageId: currentSet.damageId
            })};
            
            console.log('Photo data loaded:', photoData.damageId);
            
            // Initialize map
            const map = L.map('map').setView([${currentSet.damagePhotos[0]?.location?.latitude || -37.8136}, ${currentSet.damagePhotos[0]?.location?.longitude || 144.9631}], 16);
            
            console.log('Map created successfully');
            
            // Add tile layers
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Esri, Maxar, Earthstar Geographics'
            });
            
            // Measurement variables
            let measuring = false;
            let measurementPoints = [];
            let measurementLayer = L.layerGroup().addTo(map);
            
            // Store all markers for highlighting and real-time sync
            let allMarkers = [];
            let damageMarkers = [];
            let preconditionMarkers = [];
            let completionMarkers = [];
            let highlightedMarker = null;
            
            // Filter state
            let markerFilters = {
              damage: true,
              precondition: true,
              completion: true
            };

            console.log('Map variables initialized');

            // Enhanced photo highlighting system
            function highlightPhotoMarker(photoName) {
              // Remove previous highlight
              if (highlightedMarker) {
                highlightedMarker.setIcon(highlightedMarker._originalIcon);
                highlightedMarker = null;
              }

              // Find and highlight new marker
              allMarkers.forEach(marker => {
                if (marker._photoName === photoName) {
                  marker._originalIcon = marker._originalIcon || marker.getIcon();
                  
                  const isHighlighted = true;
                  if (marker._photoType === 'damage') {
                    marker.setIcon(createDamageIcon(marker._damageNumber, isHighlighted));
                  } else {
                    const color = marker._photoType === 'precondition' ? '#22c55e' : '#eab308';
                    const type = marker._photoType === 'precondition' ? 'PRE' : 'COM';
                    marker.setIcon(createTypeIcon(type, color, isHighlighted));
                  }
                  
                  highlightedMarker = marker;
                  
                  // Center map on highlighted marker with animation
                  map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 16), {
                    duration: 1,
                    easeLinearity: 0.25
                  });
                  
                  // Open popup briefly to show selection
                  marker.openPopup();
                  setTimeout(() => marker.closePopup(), 2000);
                }
              });
            }

            // Listen for photo highlight messages from main window
            window.addEventListener('message', (event) => {
              if (event.data.type === 'HIGHLIGHT_PHOTO' && event.data.photoName) {
                highlightPhotoMarker(event.data.photoName);
              } else if (event.data.type === 'UPDATE_SET_DATA' && event.data.photoData) {
                // Clear existing markers and update with new set data
                updateMapWithNewSet(event.data.photoData);
              }
            });

            // Function to update map with new damage report set
            function updateMapWithNewSet(newPhotoData) {
              // Clear existing markers
              allMarkers.forEach(marker => {
                map.removeLayer(marker);
              });
              allMarkers = [];
              damageMarkers = [];
              preconditionMarkers = [];
              completionMarkers = [];
              highlightedMarker = null;

              // Update window title
              document.title = \`Damage Assessment Map - \${newPhotoData.damageId}\`;
              document.querySelector('.map-title').textContent = \`📍 \${newPhotoData.damageId} - Interactive Assessment Map\`;

              // Add new markers with updated data
              let damageIndex = 1;
              newPhotoData.damagePhotos.forEach((photo, index) => {
                if (photo.location?.latitude && photo.location?.longitude) {
                  const marker = L.marker([photo.location.latitude, photo.location.longitude], {
                    icon: createDamageIcon(damageIndex)
                  }).addTo(map).bindPopup(\`
                    <div style="min-width: 250px;">
                      <img src="\${photo.url}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 6px;" />
                      <h3 style="margin: 0; color: #ef4444; font-size: 16px;">🔴 Damage \${damageIndex}</h3>
                      <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">\${photo.name}</p>
                      <div style="margin-top: 10px; padding: 8px; background: #fee2e2; border-radius: 4px; font-size: 12px;">
                        <strong>Assessment Point \${damageIndex}</strong><br>
                        Click to view in gallery
                      </div>
                    </div>
                  \`);
                  marker._photoName = photo.name;
                  marker._photoType = 'damage';
                  marker._damageNumber = damageIndex;
                  allMarkers.push(marker);
                  damageMarkers.push(marker);
                  damageIndex++;
                }
              });
              
              newPhotoData.preconditionPhotos.forEach(photo => {
                if (photo.location?.latitude && photo.location?.longitude) {
                  const marker = L.marker([photo.location.latitude, photo.location.longitude], {
                    icon: createTypeIcon('PRE', '#22c55e')
                  }).addTo(map).bindPopup(\`
                    <div style="min-width: 250px;">
                      <img src="\${photo.url}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 6px;" />
                      <h3 style="margin: 0; color: #22c55e; font-size: 16px;">🟢 Precondition</h3>
                      <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">\${photo.name}</p>
                    </div>
                  \`);
                  marker._photoName = photo.name;
                  marker._photoType = 'precondition';
                  allMarkers.push(marker);
                  preconditionMarkers.push(marker);
                }
              });
              
              newPhotoData.completionPhotos.forEach(photo => {
                if (photo.location?.latitude && photo.location?.longitude) {
                  const marker = L.marker([photo.location.latitude, photo.location.longitude], {
                    icon: createTypeIcon('COM', '#eab308')
                  }).addTo(map).bindPopup(\`
                    <div style="min-width: 250px;">
                      <img src="\${photo.url}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 6px;" />
                      <h3 style="margin: 0; color: #eab308; font-size: 16px;">🟡 Completion</h3>
                      <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">\${photo.name}</p>
                    </div>
                  \`);
                  marker._photoName = photo.name;
                  marker._photoType = 'completion';
                  allMarkers.push(marker);
                  completionMarkers.push(marker);
                }
              });

              // Fit map to show all new markers
              if (allMarkers.length > 0) {
                const group = new L.featureGroup(allMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
              }

              // Apply current filter state
              applyFilters();

              console.log('Updated map with new set:', newPhotoData.damageId, 'Total markers:', allMarkers.length);
            }

            // Filter control functions
            function toggleFilter(type) {
              markerFilters[type] = !markerFilters[type];
              const button = document.getElementById(type + 'Filter');
              
              if (markerFilters[type]) {
                button.classList.remove('inactive');
                button.classList.add('active');
              } else {
                button.classList.remove('active');
                button.classList.add('inactive');
              }
              
              applyFilters();
            }

            function applyFilters() {
              // Show/hide damage markers
              damageMarkers.forEach(marker => {
                if (markerFilters.damage) {
                  if (!map.hasLayer(marker)) map.addLayer(marker);
                } else {
                  if (map.hasLayer(marker)) map.removeLayer(marker);
                }
              });

              // Show/hide precondition markers
              preconditionMarkers.forEach(marker => {
                if (markerFilters.precondition) {
                  if (!map.hasLayer(marker)) map.addLayer(marker);
                } else {
                  if (map.hasLayer(marker)) map.removeLayer(marker);
                }
              });

              // Show/hide completion markers
              completionMarkers.forEach(marker => {
                if (markerFilters.completion) {
                  if (!map.hasLayer(marker)) map.addLayer(marker);
                } else {
                  if (map.hasLayer(marker)) map.removeLayer(marker);
                }
              });

              // Update legend visibility based on filters
              updateLegendVisibility();
            }

            function updateLegendVisibility() {
              const legend = document.querySelector('.legend');
              const damageItem = legend.children[1];
              const preconditionItem = legend.children[2];
              const completionItem = legend.children[3];

              damageItem.style.opacity = markerFilters.damage ? '1' : '0.3';
              preconditionItem.style.opacity = markerFilters.precondition ? '1' : '0.3';
              completionItem.style.opacity = markerFilters.completion ? '1' : '0.3';
            }
            
            // Create enhanced icons
            const createDamageIcon = (damageNumber, isHighlighted = false) => L.divIcon({
              html: \`<div class="\${isHighlighted ? 'highlighted-marker' : ''}" style="width: 28px; height: 28px; border-radius: 50%; background-color: \${isHighlighted ? '#dc2626' : '#ef4444'}; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 11px;">\${damageNumber}</div>\`,
              className: 'custom-damage-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            
            const createTypeIcon = (type, color, isHighlighted = false) => L.divIcon({
              html: \`<div class="\${isHighlighted ? 'highlighted-marker' : ''}" style="min-width: 32px; height: 24px; border-radius: 12px; background-color: \${isHighlighted ? '#dc2626' : color}; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 9px; padding: 0 4px;">\${type}</div>\`,
              className: 'custom-type-marker',
              iconSize: [32, 24],
              iconAnchor: [16, 12]
            });
            
            // Add enhanced markers
            let damageIndex = 1;
            photoData.damagePhotos.forEach((photo, index) => {
              if (photo.location?.latitude && photo.location?.longitude) {
                const marker = L.marker([photo.location.latitude, photo.location.longitude], {
                  icon: createDamageIcon(damageIndex)
                }).addTo(map).bindPopup(\`
                  <div style="min-width: 250px;">
                    <img src="\${photo.url}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 6px;" />
                    <h3 style="margin: 0; color: #ef4444; font-size: 16px;">🔴 Damage \${damageIndex}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">\${photo.name}</p>
                    <div style="margin-top: 10px; padding: 8px; background: #fee2e2; border-radius: 4px; font-size: 12px;">
                      <strong>Assessment Point \${damageIndex}</strong><br>
                      Click to view in gallery
                    </div>
                  </div>
                \`);
                marker._photoName = photo.name;
                marker._photoType = 'damage';
                marker._damageNumber = damageIndex;
                allMarkers.push(marker);
                damageMarkers.push(marker);
                damageIndex++;
              }
            });
            
            photoData.preconditionPhotos.forEach(photo => {
              if (photo.location?.latitude && photo.location?.longitude) {
                const marker = L.marker([photo.location.latitude, photo.location.longitude], {
                  icon: createTypeIcon('PRE', '#22c55e')
                }).addTo(map).bindPopup(\`
                  <div style="min-width: 250px;">
                    <img src="\${photo.url}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 6px;" />
                    <h3 style="margin: 0; color: #22c55e; font-size: 16px;">🟢 Precondition</h3>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">\${photo.name}</p>
                  </div>
                \`);
              marker._photoName = photo.name;
              marker._photoType = 'precondition';
              allMarkers.push(marker);
              preconditionMarkers.push(marker);
              }
            });
            
            photoData.completionPhotos.forEach(photo => {
              if (photo.location?.latitude && photo.location?.longitude) {
                const marker = L.marker([photo.location.latitude, photo.location.longitude], {
                  icon: createTypeIcon('COM', '#eab308')
                }).addTo(map).bindPopup(\`
                  <div style="min-width: 250px;">
                    <img src="\${photo.url}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 6px;" />
                    <h3 style="margin: 0; color: #eab308; font-size: 16px;">🟡 Completion</h3>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">\${photo.name}</p>
                  </div>
                \`);
              marker._photoName = photo.name;
              marker._photoType = 'completion';
              allMarkers.push(marker);
              completionMarkers.push(marker);
              }
            });
            
            // Map controls
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
            
            window.startMeasurement = () => {
              measuring = !measuring;
              const btn = document.getElementById('measureBtn');
              if (measuring) {
                btn.classList.add('active');
                btn.textContent = '⏹️ Stop';
                map.getContainer().style.cursor = 'crosshair';
              } else {
                btn.classList.remove('active');
                btn.textContent = '📏 Measure';
                map.getContainer().style.cursor = '';
                measurementPoints = [];
              }
            };
            
            // Measurement functionality
            map.on('click', function(e) {
              if (measuring) {
                measurementPoints.push(e.latlng);
                
                if (measurementPoints.length === 1) {
                  // First point
                  L.marker(e.latlng, {
                    icon: L.divIcon({
                      html: '<div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%;"></div>',
                      iconSize: [12, 12],
                      iconAnchor: [6, 6]
                    })
                  }).addTo(measurementLayer);
                } else if (measurementPoints.length === 2) {
                  // Second point and line
                  const point1 = measurementPoints[0];
                  const point2 = measurementPoints[1];
                  
                  L.marker(point2, {
                    icon: L.divIcon({
                      html: '<div style="width: 12px; height: 12px; background: #ef4444; border: 2px solid white; border-radius: 50%;"></div>',
                      iconSize: [12, 12],
                      iconAnchor: [6, 6]
                    })
                  }).addTo(measurementLayer);
                  
                  const line = L.polyline([point1, point2], {color: '#3b82f6', weight: 3}).addTo(measurementLayer);
                  const distance = Math.round(point1.distanceTo(point2));
                  
                  const midpoint = L.latLng(
                    (point1.lat + point2.lat) / 2,
                    (point1.lng + point2.lng) / 2
                  );
                  
                  L.marker(midpoint, {
                    icon: L.divIcon({
                      html: \`<div style="background: white; padding: 4px 8px; border-radius: 4px; border: 2px solid #3b82f6; font-size: 12px; font-weight: bold; color: #3b82f6;">\${distance}m</div>\`,
                      className: 'distance-label',
                      iconAnchor: [0, 0]
                    })
                  }).addTo(measurementLayer);
                  
                  document.getElementById('distanceDisplay').style.display = 'block';
                  document.getElementById('distanceValue').textContent = distance;
                  
                  measuring = false;
                  document.getElementById('measureBtn').classList.remove('active');
                  document.getElementById('measureBtn').textContent = '📏 Measure';
                  map.getContainer().style.cursor = '';
                  measurementPoints = [];
                }
              }
            });
            
            window.clearMeasurements = () => {
              measurementLayer.clearLayers();
              document.getElementById('distanceDisplay').style.display = 'none';
              measuring = false;
              measurementPoints = [];
              const btn = document.getElementById('measureBtn');
              btn.classList.remove('active');
              btn.textContent = '📏 Measure';
              map.getContainer().style.cursor = '';
            };
            
            window.fitBounds = () => {
              const allCoords = [...photoData.damagePhotos, ...photoData.preconditionPhotos, ...photoData.completionPhotos]
                .filter(p => p.location?.latitude && p.location?.longitude)
                .map(p => [p.location.latitude, p.location.longitude]);
              if (allCoords.length > 0) {
                map.fitBounds(allCoords, {padding: [20, 20]});
              }
            };
            
            // Listen for gallery-to-map highlighting
            window.addEventListener('message', function(event) {
              if (event.data.type === 'HIGHLIGHT_PHOTO') {
                // Remove previous highlight
                if (highlightedMarker) {
                  const oldIcon = highlightedMarker._photoType === 'damage' 
                    ? createDamageIcon(highlightedMarker._damageNumber, false)
                    : createTypeIcon(
                        highlightedMarker._photoType === 'precondition' ? 'PRE' : 'COM',
                        highlightedMarker._photoType === 'precondition' ? '#22c55e' : '#eab308',
                        false
                      );
                  highlightedMarker.setIcon(oldIcon);
                }
                
                // Find and highlight the new marker
                const targetMarker = allMarkers.find(marker => marker._photoName === event.data.photoName);
                if (targetMarker) {
                  const newIcon = targetMarker._photoType === 'damage' 
                    ? createDamageIcon(targetMarker._damageNumber, true)
                    : createTypeIcon(
                        targetMarker._photoType === 'precondition' ? 'PRE' : 'COM',
                        targetMarker._photoType === 'precondition' ? '#22c55e' : '#eab308',
                        true
                      );
                  targetMarker.setIcon(newIcon);
                  highlightedMarker = targetMarker;
                  
                  // Pan to the highlighted marker
                  map.panTo(targetMarker.getLatLng());
                }
              }
            });
            
            // Auto-fit on load
            setTimeout(() => {
              try {
                if (typeof fitBounds === 'function') {
                  fitBounds();
                }
                console.log('Map setup completed successfully');
              } catch (e) {
                console.error('Error in map auto-fit:', e);
              }
            }, 1000);
          </script>
        </body>
      </html>
    `);
    
    newMapWindow.document.close();
    console.log('Map window document written and closed');
    
    } catch (error) {
      console.error('Error creating map window:', error);
      toast.error('Failed to create map window. Check console for details.');
      return;
    }
    
    // Handle window closing
    const checkClosed = setInterval(() => {
      if (newMapWindow.closed) {
        setMapWindow(null);
        clearInterval(checkClosed);
      }
    }, 1000);
    toast.success(`Enhanced map opened for ${currentSet.damageId} with real-time highlighting!`);
  }, [currentSet]);

  const handlePhotoSelect = useCallback((galleryType: GalleryType, photo: PhotoMetadata) => {
    if (setMode) {
      // In set mode, find the index and sync all galleries to the same index
      const currentGallery = state.galleries[galleryType];
      const photoIndex = currentGallery.candidatePhotos.findIndex(p => p.name === photo.name);
      
      if (photoIndex >= 0) {
        setState(prev => {
          const newGalleries = { ...prev.galleries };
          
          // Update all galleries to the same index if they have photos at that index
          (['precondition', 'damage', 'completion'] as GalleryType[]).forEach(type => {
            const gallery = newGalleries[type];
            if (gallery.candidatePhotos[photoIndex]) {
              newGalleries[type] = {
                ...gallery,
                selectedPhoto: gallery.candidatePhotos[photoIndex]
              };
            }
          });
          
          return {
            ...prev,
            galleries: newGalleries
          };
        });
        
        toast.success(`Set ${photoIndex + 1} selected across all galleries`);
      }
    } else {
      // Normal mode - only update the specific gallery
      setState(prev => ({
        ...prev,
        galleries: {
          ...prev.galleries,
          [galleryType]: {
            ...prev.galleries[galleryType],
            selectedPhoto: photo
          }
        },
        selectedPhotos: {
          ...prev.selectedPhotos,
          [galleryType]: photo
        }
      }));
    }
  }, [state.galleries, setMode]);

  const toggleSetMode = useCallback(() => {
    setSetMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // When enabling set mode, sync all galleries to index 0 if available
        setState(prevState => {
          const newGalleries = { ...prevState.galleries };
          
          (['precondition', 'damage', 'completion'] as GalleryType[]).forEach(type => {
            const gallery = newGalleries[type];
            if (gallery.candidatePhotos[0]) {
              newGalleries[type] = {
                ...gallery,
                selectedPhoto: gallery.candidatePhotos[0]
              };
            }
          });
          
          return {
            ...prevState,
            galleries: newGalleries
          };
        });
        
        toast.success('Set Mode enabled - photos will navigate together');
      } else {
        toast.info('Set Mode disabled - independent photo navigation');
      }
      return newMode;
    });
  }, []);

  const toggleManualMode = useCallback(() => {
    setManualMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // Clear all galleries when entering manual mode
        setState(prevState => ({
          ...prevState,
          galleries: {
            precondition: { ...prevState.galleries.precondition, candidatePhotos: [], selectedPhoto: undefined },
            damage: { ...prevState.galleries.damage, candidatePhotos: [], selectedPhoto: undefined },
            completion: { ...prevState.galleries.completion, candidatePhotos: [], selectedPhoto: undefined }
          }
        }));
        toast.info('Manual mode enabled - drag & drop photos to galleries');
      } else {
        // Restore original data when exiting manual mode if available
        if (currentSet) {
          setState(prevState => ({
            ...prevState,
            galleries: {
              precondition: {
                ...prevState.galleries.precondition,
                candidatePhotos: currentSet.preconditionPhotos,
                selectedPhoto: currentSet.preconditionPhotos[0]
              },
              damage: {
                ...prevState.galleries.damage,
                candidatePhotos: currentSet.damagePhotos,
                selectedPhoto: currentSet.damagePhotos[0]
              },
              completion: {
                ...prevState.galleries.completion,
                candidatePhotos: currentSet.completionPhotos,
                selectedPhoto: currentSet.completionPhotos[0]
              }
            }
          }));
        }
        toast.info('Manual mode disabled - restored original data');
      }
      return newMode;
    });
  }, [currentSet]);

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

  const handleManualPhotoUpload = useCallback((galleryType: GalleryType, files: FileList) => {
    const newPhotos: PhotoMetadata[] = Array.from(files).map(file => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      timestamp: new Date()
    }));

    setState(prev => {
      const updatedGallery = {
        ...prev.galleries[galleryType],
        candidatePhotos: [...prev.galleries[galleryType].candidatePhotos, ...newPhotos],
        selectedPhoto: prev.galleries[galleryType].selectedPhoto || newPhotos[0]
      };

      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [galleryType]: updatedGallery
        }
      };
    });

    toast.success(`Added ${newPhotos.length} photo(s) to ${galleryType} gallery`);
  }, []);

  const handleClearGallery = useCallback((galleryType: GalleryType) => {
    setState(prev => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [galleryType]: {
          ...prev.galleries[galleryType],
          candidatePhotos: [],
          selectedPhoto: undefined
        }
      }
    }));
    toast.success(`Cleared ${galleryType} gallery`);
  }, []);

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
              showUserGuide={showUserGuide}
              onToggleUserGuide={() => setShowUserGuide(!showUserGuide)}
              manualMode={manualMode}
              onToggleManualMode={toggleManualMode}
              setMode={setMode}
              onToggleSetMode={toggleSetMode}
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


            {/* Main Content Layout - Gallery First (Leftmost) */}
            <div className="flex gap-2 h-[75vh]">
              
              {/* Photo Galleries - Full Width */}
              <div className={`w-full grid gap-1 ${
                visibleGalleries === 1 ? 'grid-cols-1' :
                visibleGalleries === 2 ? 'grid-cols-2' : 
                'grid-cols-3'
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
                  manualMode={manualMode}
                  onPhotosUpload={(files) => handleManualPhotoUpload('precondition', files)}
                  onClearGallery={() => handleClearGallery('precondition')}
                  setMode={setMode}
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
                  manualMode={manualMode}
                  onPhotosUpload={(files) => handleManualPhotoUpload('damage', files)}
                  onClearGallery={() => handleClearGallery('damage')}
                  setMode={setMode}
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
                  manualMode={manualMode}
                  onPhotosUpload={(files) => handleManualPhotoUpload('completion', files)}
                  onClearGallery={() => handleClearGallery('completion')}
                  setMode={setMode}
                />
              </div>
              
            </div>
          </>
        )}
      </div>

      <UserGuide 
        open={showUserGuide} 
        onOpenChange={setShowUserGuide} 
      />

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