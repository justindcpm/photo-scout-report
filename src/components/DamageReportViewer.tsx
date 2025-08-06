import { useState, useCallback } from 'react';
import { ReportUploader } from './ReportUploader';
import { ReportHeader } from './ReportHeader';
import { PhotoGallery } from './PhotoGallery';
import { DamageMap } from './DamageMap';
import { ReportGenerator } from './ReportGenerator';
import { ApprovalControls } from './ApprovalControls';
import { PhotoSet, GalleryType, DamageReportState, PhotoMetadata, PhotoSetApproval } from '@/types/damage-report';
import { processFolderStructure } from '@/utils/photo-processing';
import { toast } from 'sonner';

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

  const handleToggleMap = useCallback(() => {
    setState(prev => ({ ...prev, mapVisible: !prev.mapVisible }));
  }, []);

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
    toast.success(`Assessment updated for ${damageId}`);
  }, []);

  const currentSet = state.photoSets[state.currentSetIndex];
  const galleryVisibility = {
    precondition: state.galleries.precondition.visible,
    damage: state.galleries.damage.visible,
    completion: state.galleries.completion.visible
  };

  const visibleGalleries = Object.values(galleryVisibility).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
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
              onToggleMap={handleToggleMap}
              mapVisible={state.mapVisible}
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
              />
            )}

            {/* Report Generator */}
            {showReportGenerator && (
              <ReportGenerator photoSets={state.photoSets} />
            )}

            {/* Map */}
            {state.mapVisible && (
              <DamageMap
                photoSet={currentSet}
                visible={state.mapVisible}
                onPhotoSelect={handlePhotoSelect}
              />
            )}


            {/* Photo Galleries */}
            <div className={`grid gap-4 h-[700px] ${
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
    </div>
  );
};