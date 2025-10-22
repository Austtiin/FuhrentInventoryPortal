'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { 
  PhotoIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getVehicleImageUrl } from '@/lib/imageUtils';

interface VehicleImage {
  url: string;
  number: number;
}

interface SingleVehicleImageProps {
  vin: string | undefined;
  typeId: number;
  className?: string;
}

export const SingleVehicleImage: React.FC<SingleVehicleImageProps> = ({ 
  vin, 
  typeId, 
  className = ''
}) => {
  const [firstImage, setFirstImage] = useState<VehicleImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<VehicleImage | null>(null);
  const [imageAttempts, setImageAttempts] = useState<{number: number, extension: string}[]>([]);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);

  useEffect(() => {
    if (!vin) {
      setFirstImage(null);
      setError(null);
      return;
    }
    
    // Generate attempts: 1.png, 1.jpg, 1.jpeg, 2.png, 2.jpg, 2.jpeg, etc.
    const attempts: {number: number, extension: string}[] = [];
    const extensions = ['png', 'jpg', 'jpeg'];
    const maxNumbers = 5; // Try first 5 numbers
    
    for (let num = 1; num <= maxNumbers; num++) {
      for (const ext of extensions) {
        attempts.push({ number: num, extension: ext });
      }
    }
    
    setImageAttempts(attempts);
    setCurrentAttemptIndex(0);
    setError(null);
    
    // Start with the first attempt
    if (attempts.length > 0) {
      const firstAttempt = attempts[0];
      const url = getVehicleImageUrl(vin, firstAttempt.number, firstAttempt.extension);
      setFirstImage({ url, number: firstAttempt.number });
    }
  }, [vin, typeId]);

  const tryNextImage = () => {
    if (currentAttemptIndex < imageAttempts.length - 1) {
      const nextIndex = currentAttemptIndex + 1;
      setCurrentAttemptIndex(nextIndex);
      const nextAttempt = imageAttempts[nextIndex];
      const url = getVehicleImageUrl(vin!, nextAttempt.number, nextAttempt.extension);
      setFirstImage({ url, number: nextAttempt.number });
    } else {
      // No more attempts, show error
      setError('No image found');
      setFirstImage(null);
    }
  };

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
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="animate-pulse flex flex-col items-center justify-center p-4">
          <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer ${className}`}>
        <Image
          src={firstImage.url}
          alt={`Vehicle image ${firstImage.number}`}
          fill
          className="object-cover hover:scale-105 transition-transform duration-200"
          onClick={() => setSelectedImage(firstImage)}
          onError={tryNextImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
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