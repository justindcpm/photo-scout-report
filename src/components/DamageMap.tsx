import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ruler, Satellite, Map as MapIcon } from 'lucide-react';
import { PhotoSet, PhotoMetadata } from '@/types/damage-report';
import { calculateDistance } from '@/utils/photo-processing';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DamageMapProps {
  photoSet?: PhotoSet;
  visible: boolean;
  onPhotoSelect?: (type: 'damage' | 'precondition' | 'completion', photo: PhotoMetadata) => void;
}

export const DamageMap = ({ photoSet, visible, onPhotoSelect }: DamageMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [satelliteView, setSatelliteView] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [autoDistance, setAutoDistance] = useState<number | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  // Debug logging
  console.log('DamageMap render:', { 
    photoSet: photoSet?.damageId, 
    visible, 
    damagePhotos: photoSet?.damagePhotos?.length,
    hasLocation: photoSet?.damagePhotos?.some(p => p.location)
  });

  useEffect(() => {
    if (!visible || !mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([40.7128, -74.0060], 13); // Default to NYC

      // Add base tile layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      // Add default layer
      osmLayer.addTo(mapRef.current);

      // Initialize measure layer
      measureLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Store layers for later use
      (mapRef.current as any)._osmLayer = osmLayer;
      (mapRef.current as any)._satelliteLayer = satelliteLayer;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!mapRef.current || !photoSet || !visible) return;

    // Clear existing markers (except those in measure layer)
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && !measureLayerRef.current?.hasLayer(layer)) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Clear previous auto-distance measurements
    if (measureLayerRef.current) {
      measureLayerRef.current.eachLayer((layer) => {
        if ((layer as any)._autoDistance) {
          measureLayerRef.current!.removeLayer(layer);
        }
      });
    }

    const allPhotos = [
      ...photoSet.damagePhotos,
      ...photoSet.preconditionPhotos,
      ...photoSet.completionPhotos
    ];

    const photosWithLocation = allPhotos.filter(photo => photo.location);

    console.log('Photos with location:', photosWithLocation.length, 'out of', allPhotos.length);

    if (photosWithLocation.length === 0) {
      console.log('No photos with location data found');
      return;
    }

    // Create marker icons for different photo types
    const createIcon = (color: string) => L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        background-color: ${color}; 
        border: 2px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const damageIcon = createIcon('#ef4444');
    const preconditionIcon = createIcon('#22c55e');
    const completionIcon = createIcon('#eab308');

    // Add markers for each photo type
    photoSet.damagePhotos.forEach(photo => {
      if (photo.location) {
        L.marker([photo.location.latitude, photo.location.longitude], { icon: damageIcon })
          .bindPopup(`<strong>Damage Photo</strong><br/>${photo.name}`)
          .on('click', () => {
            onPhotoSelect?.('damage', photo);
          })
          .addTo(mapRef.current!);
      }
    });

    photoSet.preconditionPhotos.forEach(photo => {
      if (photo.location) {
        L.marker([photo.location.latitude, photo.location.longitude], { icon: preconditionIcon })
          .bindPopup(`<strong>Precondition Photo</strong><br/>${photo.name}`)
          .on('click', () => {
            onPhotoSelect?.('precondition', photo);
          })
          .addTo(mapRef.current!);
      }
    });

    photoSet.completionPhotos.forEach(photo => {
      if (photo.location) {
        L.marker([photo.location.latitude, photo.location.longitude], { icon: completionIcon })
          .bindPopup(`<strong>Completion Photo</strong><br/>${photo.name}`)
          .on('click', () => {
            onPhotoSelect?.('completion', photo);
          })
          .addTo(mapRef.current!);
      }
    });

    // Fit map to show all markers
    if (photosWithLocation.length > 0) {
      const group = new L.FeatureGroup(
        photosWithLocation.map(photo => 
          L.marker([photo.location!.latitude, photo.location!.longitude])
        )
      );
      mapRef.current.fitBounds(group.getBounds().pad(0.1));

      // Calculate automatic distance from first to last GPS point
      if (photosWithLocation.length >= 2) {
        const sortedPhotos = [...photosWithLocation].sort((a, b) => 
          (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
        );
        const firstPhoto = sortedPhotos[0];
        const lastPhoto = sortedPhotos[sortedPhotos.length - 1];
        
        if (firstPhoto.location && lastPhoto.location) {
          const distance = calculateDistance(
            firstPhoto.location.latitude,
            firstPhoto.location.longitude,
            lastPhoto.location.latitude,
            lastPhoto.location.longitude
          );
          setAutoDistance(distance);
          
          // Draw line between first and last point
          const polyline = L.polyline([
            [firstPhoto.location.latitude, firstPhoto.location.longitude],
            [lastPhoto.location.latitude, lastPhoto.location.longitude]
          ], {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }).addTo(measureLayerRef.current!);
          
          // Mark as auto-distance layer
          (polyline as any)._autoDistance = true;
          
          // Add distance label
          const midpoint = polyline.getCenter();
          const distanceMarker = L.marker(midpoint, {
            icon: L.divIcon({
              className: 'distance-label',
              html: `<div style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #3b82f6; color: #3b82f6;">Auto: ${distance.toFixed(1)}m</div>`,
              iconSize: [80, 20],
              iconAnchor: [40, 10]
            })
          }).addTo(measureLayerRef.current!);
          
          // Mark as auto-distance layer
          (distanceMarker as any)._autoDistance = true;
        }
      }
    }
  }, [photoSet, visible, onPhotoSelect]);

  // Handle satellite view toggle
  const toggleSatelliteView = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current as any;
    if (satelliteView) {
      map.removeLayer(map._satelliteLayer);
      map.addLayer(map._osmLayer);
    } else {
      map.removeLayer(map._osmLayer);
      map.addLayer(map._satelliteLayer);
    }
    setSatelliteView(!satelliteView);
  };

  // Handle manual measurement
  const toggleMeasurement = () => {
    if (!mapRef.current || !measureLayerRef.current) return;
    
    if (measuring) {
      // Stop measuring
      mapRef.current.off('click');
      setMeasuring(false);
    } else {
      // Start measuring
      let isFirstClick = true;
      let firstPoint: L.LatLng | null = null;
      
      setMeasuring(true);
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        if (isFirstClick) {
          firstPoint = e.latlng;
          isFirstClick = false;
          
          // Add start marker
          L.marker(firstPoint, {
            icon: L.divIcon({
              className: 'measure-marker',
              html: '<div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; border: 2px solid white;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(measureLayerRef.current!);
        } else if (firstPoint) {
          // Add end marker and line
          const secondPoint = e.latlng;
          
          L.marker(secondPoint, {
            icon: L.divIcon({
              className: 'measure-marker',
              html: '<div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; border: 2px solid white;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          }).addTo(measureLayerRef.current!);
          
          const distance = calculateDistance(
            firstPoint.lat, firstPoint.lng,
            secondPoint.lat, secondPoint.lng
          );
          
          const polyline = L.polyline([firstPoint, secondPoint], {
            color: '#ef4444',
            weight: 3,
            opacity: 0.8
          }).addTo(measureLayerRef.current!);
          
          // Add distance label
          const midpoint = polyline.getCenter();
          L.marker(midpoint, {
            icon: L.divIcon({
              className: 'distance-label',
              html: `<div style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #ef4444; color: #ef4444;">${distance.toFixed(1)}m</div>`,
              iconSize: [60, 20],
              iconAnchor: [30, 10]
            })
          }).addTo(measureLayerRef.current!);
          
          // Reset for next measurement
          firstPoint = null;
          isFirstClick = true;
        }
      });
    }
  };

  // Clear all measurements
  const clearMeasurements = () => {
    if (measureLayerRef.current) {
      measureLayerRef.current.clearLayers();
    }
    setAutoDistance(null);
    setMeasuring(false);
    if (mapRef.current) {
      mapRef.current.off('click');
    }
  };

  if (!visible) return null;

  return (
    <Card className="h-96 overflow-hidden shadow-map">
      <div className="p-3 border-b bg-gradient-header text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Photo Locations & Measurements</h3>
            <div className="flex gap-4 text-xs mt-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-damage rounded-full border border-white"></div>
                <span>Damage</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-precondition rounded-full border border-white"></div>
                <span>Precondition</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-completion rounded-full border border-white"></div>
                <span>Completion</span>
              </div>
              {autoDistance && (
                <div className="flex items-center gap-1 ml-4">
                  <span>Auto Distance: {autoDistance.toFixed(1)}m</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSatelliteView}
              className={`text-primary-foreground hover:bg-primary-foreground/20 ${satelliteView ? 'bg-primary-foreground/20' : ''}`}
            >
              {satelliteView ? <MapIcon className="w-4 h-4" /> : <Satellite className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMeasurement}
              className={`text-primary-foreground hover:bg-primary-foreground/20 ${measuring ? 'bg-primary-foreground/20' : ''}`}
            >
              <Ruler className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMeasurements}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-full w-full" />
    </Card>
  );
};