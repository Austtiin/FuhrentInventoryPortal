'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { 
  PhotoIcon, 
  TrashIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useUnitImages, UnitImage } from '@/hooks/useUnitImages';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiFetch } from '@/lib/apiClient';

interface VehicleImageGalleryProps {
  vin: string | undefined;
  typeId: number;
  mode?: 'single' | 'gallery';
  editable?: boolean;
  unitId?: string | number;
  maxImages?: number;
  onNotification?: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
  className?: string;
}

interface UploadStatus {
  filename: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const VehicleImageGallery: React.FC<VehicleImageGalleryProps> = ({ 
  vin, 
  mode = 'gallery',
  editable = false,
  unitId,
  maxImages = 10,
  onNotification,
  className = ''
}) => {
  // Resolve UnitID for API-backed image listing (avoid direct blob probing)
  const [resolvedUnitId, setResolvedUnitId] = useState<string | number | undefined>(unitId);
  const [resolvingId, setResolvingId] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (unitId != null && unitId !== '') {
        setResolvedUnitId(unitId);
        setResolveError(null);
        return;
      }
      if (!vin) {
        setResolvedUnitId(undefined);
        setResolveError('Missing unit id or VIN');
        return;
      }
      setResolvingId(true);
      setResolveError(null);
      try {
        const res = await apiFetch(`/checkvin/${encodeURIComponent(vin)}`, { cache: 'no-store', skipRetry: true });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`VIN lookup failed: ${res.status} ${txt?.slice(0,120)}`);
        }
        const data = await res.json().catch(() => ({}));
        const id = data?.unitId ?? data?.UnitID ?? data?.id;
        if (!id && !cancelled) {
          setResolveError('VIN not found');
          setResolvedUnitId(undefined);
        } else if (!cancelled) {
          setResolvedUnitId(id);
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(e instanceof Error ? e.message : 'VIN lookup failed');
          setResolvedUnitId(undefined);
        }
      } finally {
        if (!cancelled) setResolvingId(false);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [unitId, vin]);

  // Use API hook for image listing/actions
  const api = useUnitImages(resolvedUnitId);
  const images = api.images as UnitImage[];
  const isLoading = api.isLoading || resolvingId;
  const error = api.error || resolveError;
  const uploadImage = api.uploadImage;
  const deleteImage = api.deleteImage;
  const renameImage = api.renameImage;
  const [selectedImage, setSelectedImage] = useState<UnitImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReordering, setIsReordering] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; imageNumber?: number }>(
    { open: false }
  );
  // Cache-busting for image URLs to ensure fresh loads after operations
  const [cacheBuster, setCacheBuster] = useState(0);
  const withCacheBuster = (url: string) => {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}cb=${cacheBuster}`;
  };

  // Local display state derived from API + post-refresh animations
  const [displayImages, setDisplayImages] = useState<UnitImage[]>([]);
  useEffect(() => {
    setDisplayImages(images as UnitImage[]);
    // If a rename just succeeded, animate/highlight the target tile now that images are fresh
    if (successTargetRef.current) {
      const { number, dir } = successTargetRef.current;
      const idx = (images as UnitImage[]).findIndex(img => img.number === number);
      if (idx >= 0) {
        requestAnimationFrame(() => {
          const el = itemRefs.current[idx];
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          }
          setHighlightIndex(idx);
          setMoveAnim({ key: (images as UnitImage[])[idx].name, dir });
          setTimeout(() => setMoveAnim(null), 500);
          setTimeout(() => setHighlightIndex(null), 1200);
          if (onNotification) {
            onNotification('success', 'image moved');
          }
        });
        // Clear the target only after we've found and animated it
        successTargetRef.current = null;
      }
    }
  }, [images, onNotification]);

  // Refs for scrolling/focus after move
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    itemRefs.current[index] = el;
  };
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [moveAnim, setMoveAnim] = useState<{ key: string; dir: 'up' | 'down' } | null>(null);
  // When a rename succeeds, we animate/highlight the target index after the list refreshes
  const successTargetRef = useRef<{ number: number; dir: 'up' | 'down' } | null>(null);

  // Removed optimistic helpers; movement is applied after backend success and refresh

  // Validate file is an image
  const validateImageFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type.toLowerCase())) {
      return `${file.name}: Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed.`;
    }

    if (file.size > maxSize) {
      return `${file.name}: File size exceeds 10MB limit.`;
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate all files first
    const validationErrors: string[] = [];
    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateImageFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      if (onNotification) {
        onNotification('warning', 'Invalid Files', validationErrors.join('\n'));
      } else {
        console.warn('Invalid files:', validationErrors);
      }
      if (validFiles.length === 0) {
        event.target.value = '';
        return;
      }
    }

    const filesToUpload = Math.min(validFiles.length, maxImages - images.length);
    
    if (filesToUpload < validFiles.length && onNotification) {
      onNotification('warning', 'Upload Limit', `Only uploading ${filesToUpload} files to stay within the ${maxImages} image limit.`);
    }

    setIsUploading(true);
    const statuses: UploadStatus[] = validFiles.slice(0, filesToUpload).map(f => ({
      filename: f.name,
      status: 'uploading' as const
    }));
    setUploadStatuses(statuses);

    try {
      for (let i = 0; i < filesToUpload; i++) {
        const file = validFiles[i];
        
        setUploadStatuses((prev: UploadStatus[]) => 
          prev.map((s, idx) => 
            idx === i ? { ...s, status: 'uploading' as const } : s
          )
        );
        
  const success = await uploadImage(file);
        
        setUploadStatuses((prev: UploadStatus[]) => 
          prev.map((s, idx) => 
            idx === i 
              ? { ...s, status: success ? 'success' as const : 'error' as const, error: success ? undefined : 'Upload failed' }
              : s
          )
        );
      }
      
      // Bust cache so images re-render with fresh URLs
      setCacheBuster((b) => b + 1);
      // Show success notification
      if (onNotification) {
        onNotification('success', 'Upload Complete', `Successfully uploaded ${filesToUpload} image${filesToUpload > 1 ? 's' : ''}`);
      }
    } catch {
      if (onNotification) onNotification('error', 'Upload Failed', 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadStatuses([]);
      event.target.value = '';
    }
  };

  const confirmAndDelete = async () => {
    const imageNumber = confirmDelete.imageNumber;
    if (!imageNumber && imageNumber !== 0) return;
    const success = await deleteImage(imageNumber);
    if (!success) {
      if (onNotification) onNotification('error', 'Delete Failed', 'Failed to delete image. Please try again.');
    } else {
      setDisplayImages(prev => prev.filter(img => img.number !== imageNumber));
      setCacheBuster((b) => b + 1);
      if (onNotification) {
        onNotification('success', 'Image Deleted', 'Image has been successfully deleted.');
      }
    }
    setConfirmDelete({ open: false, imageNumber: undefined });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const movedImage = displayImages[index];
    if (isReordering) return;
    setIsReordering(true);
    const oldNumber = movedImage.number;
    // Target the previous neighbor's actual number to guarantee a valid destination
    const neighborNumber = displayImages[index - 1]?.number;
    const newNumber = neighborNumber ?? Math.max(1, oldNumber - 1);
    const success = await renameImage(oldNumber, newNumber);
    if (!success) {
      if (onNotification) onNotification('error', 'Reorder Failed', 'Failed to reorder images.');
      setIsReordering(false);
      return;
    }
    // Mark the target for post-refresh animation/highlight
    successTargetRef.current = { number: newNumber, dir: 'up' };
    // Bust cache so updated order is reflected immediately
    setCacheBuster((b) => b + 1);
    // Ensure images refresh occurs now and with a couple of lazy follow-ups for eventual consistency
    api.refreshImages?.();
    setTimeout(() => api.refreshImages?.(), 400);
    setTimeout(() => api.refreshImages?.(), 1200);
    // Extra cache-bust shortly after to refresh both old and new positions in client render
    setTimeout(() => setCacheBuster((b) => b + 1), 300);
    // Release reorder lock slightly after the first refresh tick
    setTimeout(() => setIsReordering(false), 350);
  };

  const handleMoveDown = async (index: number) => {
    if (index === displayImages.length - 1) return;
    const movedImage = displayImages[index];
    if (isReordering) return;
    setIsReordering(true);
    const oldNumber = movedImage.number;
    // Target the next neighbor's actual number to guarantee a valid destination
    const neighborNumber = displayImages[index + 1]?.number;
    const newNumber = neighborNumber ?? (oldNumber + 1);
    const success = await renameImage(oldNumber, newNumber);
    if (!success) {
      if (onNotification) onNotification('error', 'Reorder Failed', 'Failed to reorder images.');
      setIsReordering(false);
      return;
    }
    successTargetRef.current = { number: newNumber, dir: 'down' };
    setCacheBuster((b) => b + 1);
    api.refreshImages?.();
    setTimeout(() => api.refreshImages?.(), 400);
    setTimeout(() => api.refreshImages?.(), 1200);
    setTimeout(() => setCacheBuster((b) => b + 1), 300);
    setTimeout(() => setIsReordering(false), 350);
  };

  // Drag & Drop removed: only arrow-based single-step renames are supported for now

  // Navigation functions for single mode
  const goToPrevious = () => {
    setCurrentImageIndex((prev: number) => prev === 0 ? images.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev: number) => prev === images.length - 1 ? 0 : prev + 1);
  };

  // If we're missing identifiers and have an error, show it

  if (error && images.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center ${className}`}>
        <PhotoIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
        <p className="text-yellow-800">{error}</p>
      </div>
    );
  }

  // Single mode display
  if (mode === 'single') {
    if (isLoading && images.length === 0) {
      return (
        <div className={`bg-gray-100 rounded-lg flex items-center justify-center animate-pulse ${className}`} style={{ minHeight: '200px' }}>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className={`bg-linear-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 ${className}`} style={{ minHeight: '200px' }}>
          <PhotoIcon className="w-12 h-12 mb-2" />
          <span className="text-sm font-medium text-center px-2">No Image Yet</span>
        </div>
      );
    }

    const currentImage = images[currentImageIndex];
    
    return (
      <div className={`relative bg-gray-50 rounded-lg overflow-hidden ${className}`}>
        {/* Main Image Display */}
        <div 
          className="relative bg-gray-100 flex items-center justify-center cursor-pointer p-1"
          style={{ 
            minHeight: '200px',
            maxHeight: 'min(400px, calc(100vh - 200px))'
          }}
          onClick={() => setSelectedImage(currentImage)}
        >
          <Image
            src={withCacheBuster(currentImage.url)}
            alt={`Vehicle image ${currentImage.number}`}
            width={800}
            height={600}
            className="object-scale-down w-full h-full"
            style={{
              maxWidth: 'calc(100% - 0.5rem)',
              maxHeight: 'calc(100vh - 200px - 0.5rem)'
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Thumbnail Indicator for image number 1 */}
          {currentImage.number === 1 && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg border border-blue-700">
              Thumbnail
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            
            {/* Image Counter */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* Thumbnails for single mode when multiple images */}
        {images.length > 1 && (
          <div className="p-2 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={`${image.name}-${index}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={withCacheBuster(image.url)}
                    alt={`Thumbnail ${image.number}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                  {/* Thumbnail Indicator for image number 1 */}
                  {image.number === 1 && (
                    <div className="absolute top-0 left-0 bg-blue-600 text-white px-1 text-xs font-bold rounded-br-md">
                      T
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fullscreen Modal for single mode */}
        {selectedImage && typeof window !== 'undefined' && createPortal(
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <XMarkIcon className="w-8 h-8 text-white" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={withCacheBuster(selectedImage.url)}
                alt={`Vehicle image ${selectedImage.number}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              Image {selectedImage.number} of {images.length}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Gallery mode display
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section - Only show if editable */}
      {editable && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-3 text-center hover:border-blue-600 transition-colors bg-gray-50">
          <PhotoIcon className="w-10 h-10 md:w-8 md:h-8 text-gray-400 mx-auto mb-3" />
          
          {/* Upload Progress */}
          {isUploading && uploadStatuses.length > 0 ? (
            <div className="space-y-3">
              <p className="text-blue-600 font-semibold text-lg">
                Uploading {uploadStatuses.length} image{uploadStatuses.length > 1 ? 's' : ''}...
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadStatuses.map((status, idx) => (
                  <div key={`upload-${status.filename}-${idx}`} className="flex items-center justify-between text-sm px-2">
                    <span className="truncate flex-1 text-left">{status.filename}</span>
                    <span className="ml-2">
                      {status.status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {status.status === 'success' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      )}
                      {status.status === 'error' && (
                        <XMarkIcon className="w-5 h-5 text-red-600" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">Please wait, do not navigate away...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-2 font-medium text-sm">
                {images.length === 0 
                  ? 'No images found. Upload photos for this vehicle'
                  : `Upload additional photos (${images.length}/${maxImages})`
                }
              </p>
              <p className="text-xs md:text-xs text-gray-600 mb-3">PNG, JPG, GIF, WEBP up to 10MB each</p>
            </>
          )}
          
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading || images.length >= maxImages}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`inline-block px-3 py-2 rounded-md cursor-pointer transition-colors font-medium text-sm ${
              isUploading || images.length >= maxImages
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </label>
          {images.length >= maxImages && (
            <p className="text-sm text-red-600 mt-2">Maximum number of images reached</p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && images.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading images...</span>
        </div>
      )}

      {/* Image Grid */}
      {displayImages.length > 0 && (
        <div className="space-y-2">
          {editable && (
            <p className="text-sm text-gray-600 italic">
              💡 Tip: Use the arrow buttons to move images one position at a time
            </p>
          )}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayImages.map((image, index) => (
                <div 
                  key={image.name}
                  ref={setItemRef(index)}
                  className={`relative group bg-white border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                    highlightIndex === index
                      ? 'border-blue-500 ring-2 ring-blue-300'
                      : 'border-gray-200'
                  } ${moveAnim && moveAnim.key === image.name ? (moveAnim.dir === 'up' ? 'animate-slide-up' : 'animate-slide-down') : ''}`}
                >
                  {/* Image */}
                  <div 
                    className="aspect-square cursor-pointer relative"
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={withCacheBuster(image.url)}
                      alt={`Vehicle image ${image.number}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>

                  {/* Image Number Badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                    #{image.number}
                  </div>

                  {/* Thumbnail Indicator for image number 1 */}
                  {image.number === 1 && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg border border-blue-700">
                      Thumbnail
                    </div>
                  )}

                  {/* Edit Controls - Only show if editable */}
                  {editable && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {/* Move Up */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={isReordering}
                          className={`p-2 rounded-md transition-colors text-white ${isReordering ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                          title="Move up"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Move Down */}
                      {index < displayImages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={isReordering}
                          className={`p-2 rounded-md transition-colors text-white ${isReordering ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                          title="Move down"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ open: true, imageNumber: image.number })}
                        className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Images State */}
      {images.length === 0 && !isLoading && !editable && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No images available</p>
        </div>
      )}

      {/* Fullscreen Modal using React Portal */}
      {selectedImage && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <XMarkIcon className="w-8 h-8 text-white" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={withCacheBuster(selectedImage.url)}
              alt={`Vehicle image ${selectedImage.number}`}
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            Image {selectedImage.number} of {images.length}
          </div>
        </div>,
        document.body
      )}
      {/* Component-scoped animations for gallery */}
      <style jsx>{`
        .animate-slide-up { animation: slide-up 220ms ease-out; }
        .animate-slide-down { animation: slide-down 220ms ease-out; }
        .animate-revert-up { animation: revert-up 260ms ease-out; }
        .animate-revert-down { animation: revert-down 260ms ease-out; }
        @keyframes slide-up { from { transform: translateY(12px); } to { transform: translateY(0); } }
        @keyframes slide-down { from { transform: translateY(-12px); } to { transform: translateY(0); } }
        @keyframes revert-up { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
        @keyframes revert-down { 0% { transform: translateY(0); } 50% { transform: translateY(10px); } 100% { transform: translateY(0); } }
      `}</style>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete image?"
        message={'Are you sure you want to delete this image? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        onConfirm={confirmAndDelete}
        onCancel={() => setConfirmDelete({ open: false, imageNumber: undefined })}
      />
    </div>
  );
};
