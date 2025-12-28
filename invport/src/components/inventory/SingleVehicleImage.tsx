'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { 
  PhotoIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';
// Removed legacy blob probing utilities; rely on API-backed unit image listing
import { useUnitImages } from '@/hooks/useUnitImages';
import { buildApiUrl } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/Loading';

interface VehicleImage {
  url: string;
  number: number;
}

interface SingleVehicleImageProps {
  vin: string | undefined;
  typeId: number;
  unitId?: string | number;
  className?: string;
  lazy?: boolean;
  onClickImage?: () => void; // Optional image click override (e.g., navigate to edit)
  onImageLoaded?: () => void; // Notify when the image has fully loaded
}

export const SingleVehicleImage: React.FC<SingleVehicleImageProps> = ({ 
  vin, 
  typeId, 
  unitId,
  className = '',
  lazy = true,
  onClickImage,
  onImageLoaded
}) => {
  const [firstImage, setFirstImage] = useState<VehicleImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<VehicleImage | null>(null);
  // Loading derives from API hook; no separate spinner state needed
  const [isInView, setIsInView] = useState(!lazy);
  const imageRef = useRef<HTMLDivElement>(null);

  // When in view, enable API-backed fetch by passing a real unit id; otherwise undefined to avoid work
  const apiUnitKey = isInView ? unitId : undefined;
  const api = useUnitImages(apiUnitKey as string | number | undefined);
  const unitImages = api.images;
  const notifiedRef = useRef(false);

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

  // Prefer API-backed image listing by UnitID; do not fallback to legacy blob probing
  useEffect(() => {
    let cancelled = false;
    async function resolveImage() {
      // Reset
      setError(null);
      setFirstImage(null);

      // If using lazy mode and not in view, skip
      if (lazy && !isInView) return;

      // If we have unitId and API images available, choose the lowest-numbered image
      if (apiUnitKey && Array.isArray(unitImages) && unitImages.length > 0) {
        // Find the image with the smallest numeric index (e.g., 1.webp)
        const lowest = unitImages.reduce((min, cur) => {
          if (cur.number <= 0) return min;
          if (!min) return cur;
          return cur.number < min.number ? cur : min;
        }, undefined as typeof unitImages[number] | undefined) || unitImages[0];

        const url = lowest.url || buildApiUrl(`units/${encodeURIComponent(String(apiUnitKey))}/images/${encodeURIComponent(lowest.name)}`);
        if (!cancelled) {
          setFirstImage(prev => {
            if (prev && prev.number === lowest.number && prev.url === url) return prev;
            return { url, number: lowest.number };
          });
        }
        return;
      }
      // No API images available
      setError('No image found');
      setFirstImage(null);
    }

    resolveImage();
    return () => { cancelled = true; };
  }, [apiUnitKey, unitImages, vin, typeId, lazy, isInView]);

  // Show loading state
  const isLoading = api.isLoading;
  if (isLoading || (!firstImage && !error && (lazy ? isInView : true))) {
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