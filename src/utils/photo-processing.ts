import exifr from 'exifr';
import { PhotoMetadata, PhotoSet, PhotoLocation } from '@/types/damage-report';

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}

/**
 * Extract metadata from image file including GPS location and orientation
 */
export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  const url = URL.createObjectURL(file);
  
  try {
    // Parse EXIF data with GPS tags
    const exifData = await exifr.parse(file, {
      gps: true,
      exif: true,
      tiff: true
    });

    console.log('EXIF data for', file.name, ':', exifData);

    let location: PhotoLocation | undefined;
    
    // Try multiple ways to access GPS data
    if (exifData?.latitude && exifData?.longitude) {
      console.log('GPS data found (direct):', exifData.latitude, exifData.longitude);
      location = {
        latitude: exifData.latitude,
        longitude: exifData.longitude
      };
    } else if (exifData?.GPS) {
      console.log('GPS object found:', exifData.GPS);
      if (exifData.GPS.latitude && exifData.GPS.longitude) {
        console.log('GPS data found (via GPS object):', exifData.GPS.latitude, exifData.GPS.longitude);
        location = {
          latitude: exifData.GPS.latitude,
          longitude: exifData.GPS.longitude
        };
      }
    }

    return {
      file,
      name: file.name,
      url,
      location,
      orientation: exifData?.orientation,
      timestamp: exifData?.DateTimeOriginal || new Date(file.lastModified)
    };
  } catch (error) {
    console.warn(`Failed to extract EXIF data from ${file.name}:`, error);
    return {
      file,
      name: file.name,
      url,
      timestamp: new Date(file.lastModified)
    };
  }
}

/**
 * Process uploaded folder structure and group photos by damage ID
 */
export async function processFolderStructure(files: FileList): Promise<PhotoSet[]> {
  const photoSets = new Map<string, {
    damage: PhotoMetadata[];
    precondition: PhotoMetadata[];
    completion: PhotoMetadata[];
  }>();

  // Process each file
  for (const file of Array.from(files)) {
    // Skip non-image files
    if (!file.type.startsWith('image/')) {
      continue;
    }

    const pathParts = file.webkitRelativePath.split('/');
    if (pathParts.length < 3) {
      console.warn(`Skipping file with unexpected path structure: ${file.webkitRelativePath}`);
      continue;
    }

    const damageId = pathParts[1]; // [Top-Level Folder]/[Damage ID]/[Photo Type Folder]/[Image File.jpg]
    const photoTypeFolder = pathParts[2].toLowerCase();
    
    // Initialize photo set if not exists
    if (!photoSets.has(damageId)) {
      photoSets.set(damageId, {
        damage: [],
        precondition: [],
        completion: []
      });
    }

    const photoMetadata = await extractPhotoMetadata(file);
    const set = photoSets.get(damageId)!;

    // Categorize by folder name
    if (photoTypeFolder.includes('damage')) {
      set.damage.push(photoMetadata);
    } else if (photoTypeFolder.includes('precondition') || photoTypeFolder.includes('before')) {
      set.precondition.push(photoMetadata);
    } else if (photoTypeFolder.includes('completion') || photoTypeFolder.includes('after')) {
      set.completion.push(photoMetadata);
    } else {
      // Default to damage if unclear
      set.damage.push(photoMetadata);
    }
  }

  // Convert to PhotoSet array and process proximity
  const processedSets: PhotoSet[] = [];
  
  for (const [damageId, photos] of photoSets) {
    // Find reference location from damage photos
    const damageWithGPS = photos.damage.find(photo => photo.location);
    const referenceLocation = damageWithGPS?.location;

    let selectedPrecondition = photos.precondition;
    let selectedCompletion = photos.completion;

    // If we have a reference location, find 10 closest photos for each category
    if (referenceLocation) {
      selectedPrecondition = photos.precondition
        .filter(photo => photo.location)
        .sort((a, b) => {
          const distanceA = calculateDistance(
            referenceLocation.latitude, 
            referenceLocation.longitude,
            a.location!.latitude, 
            a.location!.longitude
          );
          const distanceB = calculateDistance(
            referenceLocation.latitude, 
            referenceLocation.longitude,
            b.location!.latitude, 
            b.location!.longitude
          );
          return distanceA - distanceB;
        })
        .slice(0, 10)
        .concat(photos.precondition.filter(photo => !photo.location)); // Add photos without GPS at the end

      selectedCompletion = photos.completion
        .filter(photo => photo.location)
        .sort((a, b) => {
          const distanceA = calculateDistance(
            referenceLocation.latitude, 
            referenceLocation.longitude,
            a.location!.latitude, 
            a.location!.longitude
          );
          const distanceB = calculateDistance(
            referenceLocation.latitude, 
            referenceLocation.longitude,
            b.location!.latitude, 
            b.location!.longitude
          );
          return distanceA - distanceB;
        })
        .slice(0, 10)
        .concat(photos.completion.filter(photo => !photo.location)); // Add photos without GPS at the end
    }

    processedSets.push({
      damageId,
      damagePhotos: photos.damage,
      preconditionPhotos: selectedPrecondition,
      completionPhotos: selectedCompletion,
      referenceLocation
    });
  }

  return processedSets.sort((a, b) => a.damageId.localeCompare(b.damageId));
}

/**
 * Apply rotation transformation to image orientation
 */
export function getImageTransform(rotation: number): string {
  return `rotate(${rotation}deg)`;
}

/**
 * Get zoom and pan transform for image viewing
 */
export function getImageZoomTransform(
  zoom: number, 
  panX: number, 
  panY: number, 
  rotation: number
): string {
  return `scale(${zoom}) translate(${panX}px, ${panY}px) rotate(${rotation}deg)`;
}