import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { PhotoSet } from '@/types/damage-report';

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
}

export const DamageMap = ({ photoSet, visible }: DamageMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
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

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

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
          .addTo(mapRef.current!);
      }
    });

    photoSet.preconditionPhotos.forEach(photo => {
      if (photo.location) {
        L.marker([photo.location.latitude, photo.location.longitude], { icon: preconditionIcon })
          .bindPopup(`<strong>Precondition Photo</strong><br/>${photo.name}`)
          .addTo(mapRef.current!);
      }
    });

    photoSet.completionPhotos.forEach(photo => {
      if (photo.location) {
        L.marker([photo.location.latitude, photo.location.longitude], { icon: completionIcon })
          .bindPopup(`<strong>Completion Photo</strong><br/>${photo.name}`)
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
    }
  }, [photoSet, visible]);

  if (!visible) return null;

  return (
    <Card className="h-80 overflow-hidden shadow-map">
      <div className="p-3 border-b bg-gradient-header text-primary-foreground">
        <h3 className="font-semibold">Photo Locations</h3>
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
        </div>
      </div>
      <div ref={mapContainerRef} className="h-full w-full" />
    </Card>
  );
};