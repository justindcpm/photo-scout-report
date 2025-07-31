export interface PhotoLocation {
  latitude: number;
  longitude: number;
}

export interface PhotoMetadata {
  file: File;
  name: string;
  url: string;
  location?: PhotoLocation;
  orientation?: number;
  timestamp?: Date;
}

export interface PhotoSet {
  damageId: string;
  damagePhotos: PhotoMetadata[];
  preconditionPhotos: PhotoMetadata[];
  completionPhotos: PhotoMetadata[];
  referenceLocation?: PhotoLocation;
}

export interface SelectedPhotos {
  precondition?: PhotoMetadata;
  damage?: PhotoMetadata;
  completion?: PhotoMetadata;
}

export interface GalleryState {
  visible: boolean;
  selectedPhoto?: PhotoMetadata;
  candidatePhotos: PhotoMetadata[];
  rotation: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface DamageReportState {
  photoSets: PhotoSet[];
  currentSetIndex: number;
  selectedPhotos: SelectedPhotos;
  galleries: {
    precondition: GalleryState;
    damage: GalleryState;
    completion: GalleryState;
  };
  searchTerm: string;
  mapVisible: boolean;
}

export type PhotoType = 'precondition' | 'damage' | 'completion';
export type GalleryType = PhotoType;