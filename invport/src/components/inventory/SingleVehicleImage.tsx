'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  lazy = false,
  onClickImage,
  onImageLoaded
}) => {
  const [firstImage, setFirstImage] = useState<UnitImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UnitImage | null>(null);
  const [isInView, setIsInView] = useState(!lazy);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Only fetch from API if no preloaded images available
  const shouldFetchFromApi = !preloadedImages || preloadedImages.length === 0;
  const effectiveUnitId = (isInView && shouldFetchFromApi) ? unitId : undefined;
  const api = useUnitImages(effectiveUnitId);
  const unitImages = api.images;
  const notifiedRef = useRef(false);

  // Debug logging for this specific unit
  useEffect(() => {
    if (effectiveUnitId) {
      console.log(`🎬 [SingleVehicleImage UnitID=${effectiveUnitId}] State: isLoading=${api.isLoading}, error=${api.error}, images=${unitImages.length}`);
    }
  }, [effectiveUnitId, api.isLoading, api.error, unitImages.length]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imageRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Select the lowest-numbered image from preloaded or API response
  useEffect(() => {
    let cancelled = false;
    
    // If using lazy mode and not in view, skip
    if (lazy && !isInView) {
      setError(null);
      setFirstImage(null);
      return;
    }

    // Priority 1: Use preloaded images if available
    if (preloadedImages && preloadedImages.length > 0) {
      if (!cancelled) {
        // Use first preloaded image (assumed to be lowest-numbered)
        setFirstImage({ url: preloadedImages[0], number: 1 });
        setError(null);
      }
      return;
    }

    // Priority 2: No preloaded images, need to fetch from API
    if (!effectiveUnitId) {
      setError(null);
      setFirstImage(null);
      return;
    }

    // If still loading API, don't change state yet
    if (api.isLoading) {
      return;
    }

    // API finished loading - check for errors or images
    if (api.error) {
      if (!cancelled) {
        setError('Failed to load image');
        setFirstImage(null);
      }
      return;
    }

    // API succeeded - check if we have images
    if (Array.isArray(unitImages) && unitImages.length > 0) {
      // Find the image with the smallest numeric index (e.g., 1.webp)
      const lowest = unitImages.reduce((min, cur) => {
        if (cur.number <= 0) return min;
        if (!min) return cur;
        return cur.number < min.number ? cur : min;
      }, undefined as typeof unitImages[number] | undefined) || unitImages[0];

      if (!cancelled) {
        setFirstImage({ url: lowest.url, number: lowest.number });
        setError(null);
      }
    } else {
      // API succeeded but returned no images
      if (!cancelled) {
        setError('No image found');
        setFirstImage(null);
      }
    }

    return () => { cancelled = true; };
  }, [preloadedImages, effectiveUnitId, unitImages, lazy, isInView, api.isLoading, api.error]);

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

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center p-4">
          <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-xs text-gray-500 text-center">No Image Available</div>
        </div>
      </div>
    );
  }

  if (!firstImage) {
    return (
      <div ref={lazy ? imageRef : undefined} className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center p-4">
          <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-xs text-gray-500">No image</div>
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
            className="object-cover hover:scale-105 transition-transform duration-200"
            onClick={() => {
              if (onClickImage) {
                onClickImage();
              } else {
                setSelectedImage(firstImage);
              }
            }}
            onLoad={() => {
              if (!notifiedRef.current) {
                notifiedRef.current = true;
                onImageLoaded?.();
              }
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
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