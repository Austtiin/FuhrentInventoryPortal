'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { 
  PhotoIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useUnitImages } from '@/hooks/useUnitImages';
import { LoadingSpinner } from '@/components/ui/Loading';

interface UnitImage {
  url: string;
  number: number;
}

interface SingleVehicleImageProps {
  unitId: string | number | undefined;
  preloadedImages?: string[]; // Image URLs already loaded with inventory metadata
  className?: string;
  lazy?: boolean;
  onClickImage?: () => void;
  onImageLoaded?: () => void;
}

export const SingleVehicleImage: React.FC<SingleVehicleImageProps> = ({ 
  unitId,
  preloadedImages,
  className = '',
  lazy = true,
  onClickImage,
  onImageLoaded
}) => {
  const [selectedImage, setSelectedImage] = useState<UnitImage | null>(null);
  const [isInView, setIsInView] = useState(!lazy);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Only fetch from API if no preloaded images available
  const shouldFetchFromApi = !preloadedImages || preloadedImages.length === 0;
  const effectiveUnitId = (isInView && shouldFetchFromApi) ? unitId : undefined;
  const api = useUnitImages(effectiveUnitId);
  const unitImages = api.images;
  const notifiedRef = useRef(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView || !imageRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px', threshold: 0 }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [lazy, isInView]);

  const firstImage = useMemo<UnitImage | null>(() => {
    if (lazy && !isInView) return null;
    if (preloadedImages?.length) return { url: preloadedImages[0], number: 1 };
    if (!effectiveUnitId || !unitImages.length) return null;
    return unitImages[0];
  }, [preloadedImages, effectiveUnitId, unitImages, lazy, isInView]);
  const error = !firstImage && isInView && !api.isLoading
    ? (api.error ? 'Failed to load image' : (effectiveUnitId || !unitId ? 'No image found' : null))
    : null;

  // Show loading state only when actively loading from API (not for preloaded images)
  if (shouldFetchFromApi && api.isLoading && (!lazy || isInView)) {
    return (
      <div ref={lazy ? imageRef : undefined} className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center p-4">
          <LoadingSpinner size="md" />
          <div className="text-xs text-gray-500 mt-2">Loading image...</div>
        </div>
      </div>
    );
  }

  if (error || (firstImage && failedUrl === firstImage.url)) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center p-4">
          <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-xs text-gray-500 text-center">{error === 'No image found' ? 'No Image Available' : 'Unable to load image'}</div>
          {error !== 'No image found' && (
            <button type="button" className="mt-2 text-xs text-blue-700 underline" onClick={() => {
              setFailedUrl(null);
              void api.refreshImages();
            }}>Retry image</button>
          )}
        </div>
      </div>
    );
  }

  if (!firstImage) {
    return (
      <div ref={lazy ? imageRef : undefined} className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center p-4">
          {isInView ? <LoadingSpinner size="md" /> : <PhotoIcon className="w-8 h-8 text-gray-400" />}
          <div className="text-xs text-gray-500 mt-2" role="status">Loading image...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={lazy ? imageRef : undefined} className={`relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer ${className}`}>
        {(!lazy || isInView) && firstImage && (
          <Image
            src={firstImage.url}
            alt={`Vehicle image ${firstImage.number}`}
            fill
            loading="eager"
            decoding="async"
            className="object-cover hover:scale-105 transition-transform duration-200"
            onClick={() => {
              if (onClickImage) {
                onClickImage();
              } else {
                setSelectedImage(firstImage);
              }
            }}
            onLoad={() => {
              setLoadedUrl(firstImage.url);
              if (!notifiedRef.current) {
                notifiedRef.current = true;
                onImageLoaded?.();
              }
            }}
            onError={() => {
              console.error('Failed to load vehicle image', firstImage.url);
              setFailedUrl(firstImage.url);
            }}
            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}
        {loadedUrl !== firstImage.url && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 pointer-events-none" role="status" aria-label="Loading image">
            <LoadingSpinner size="md" />
          </div>
        )}
        {api.error && firstImage && (
          <div role="alert" className="absolute bottom-0 inset-x-0 bg-white p-2 text-xs text-red-700">
            Could not refresh image. <button type="button" className="underline" onClick={() => void api.refreshImages()}>Retry</button>
          </div>
        )}
        {lazy && !isInView && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center p-4">
              <LoadingSpinner size="md" />
              <div className="text-xs text-gray-500 mt-2">Loading...</div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal (only if no onClick override provided) */}
      {!onClickImage && selectedImage && typeof window !== 'undefined' && createPortal(
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
              src={selectedImage.url}
              alt={`Vehicle image ${selectedImage.number}`}
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            Vehicle Image
          </div>
        </div>,
        document.body
      )}
    </>
  );
};