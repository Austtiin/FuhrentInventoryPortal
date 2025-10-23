'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { 
  PhotoIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getVehicleImageUrl, checkImageExists } from '@/lib/imageUtils';
import { LoadingSpinner } from '@/components/ui/Loading';

interface VehicleImage {
  url: string;
  number: number;
}

interface SingleVehicleImageProps {
  vin: string | undefined;
  typeId: number;
  className?: string;
  lazy?: boolean;
}

export const SingleVehicleImage: React.FC<SingleVehicleImageProps> = ({ 
  vin, 
  typeId, 
  className = '',
  lazy = true
}) => {
  const [firstImage, setFirstImage] = useState<VehicleImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<VehicleImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imageRef = useRef<HTMLDivElement>(null);

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

  // Enhanced image loading with URL checking
  useEffect(() => {
    if (!vin || (lazy && !isInView)) {
      setFirstImage(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    const findAvailableImage = async () => {
      setIsLoading(true);
      setError(null);
      setFirstImage(null);
      
      try {
        // Generate attempts: 1.png, 1.jpg, 1.jpeg, 2.png, 2.jpg, 2.jpeg, etc.
        const extensions = ['png', 'jpg', 'jpeg'];
        const maxNumbers = 5; // Try first 5 numbers
        
        for (let num = 1; num <= maxNumbers; num++) {
          for (const ext of extensions) {
            const url = getVehicleImageUrl(vin, num, ext);
            
            try {
              // Check if URL exists before trying to load
              const exists = await checkImageExists(url);
              if (exists) {
                setFirstImage({ url, number: num });
                setIsLoading(false);
                return; // Found a valid image, exit
              }
            } catch (checkError) {
              // Continue to next attempt if check fails
              console.log(`Image check failed for ${url}:`, checkError);
              continue;
            }
          }
        }
        
        // No images found after all attempts
        setError('No image found');
        setFirstImage(null);
      } catch (err) {
        console.error('Error finding available image:', err);
        setError('Failed to load image');
        setFirstImage(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    findAvailableImage();
  }, [vin, typeId, lazy, isInView]);

  // Show loading state
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
            onClick={() => setSelectedImage(firstImage)}
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

      {/* Fullscreen Modal */}
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