import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface VehicleImageProps {
  vehicleId: string;
  make?: string;
  model?: string;
  year?: number;
  className?: string;
}

const VehicleImage: React.FC<VehicleImageProps> = ({ 
  vehicleId, 
  make, 
  model, 
  year, 
  className = "w-full h-32 object-cover rounded-lg" 
}) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    const loadVehicleImage = async () => {
      try {
        setImageStatus('loading');
        
        // Simulate API call to get vehicle image
        // This will always fail as requested to show "No Image Yet"
        const response = await fetch(`/api/vehicles/${vehicleId}/image`);
        
        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setImageSrc(imageUrl);
          setImageStatus('loaded');
        } else {
          throw new Error('Image not found');
        }
      } catch {
        // Expected to fail - show placeholder
        setImageStatus('error');
      }
    };

    if (vehicleId) {
      loadVehicleImage();
    }

    // Cleanup object URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [vehicleId, imageSrc]);

  if (imageStatus === 'loading') {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center animate-pulse`}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (imageStatus === 'loaded' && imageSrc) {
    return (
      <Image 
        src={imageSrc} 
        alt={`${year} ${make} ${model}`}
        className={className}
        width={400}
        height={300}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  // Default placeholder for no image
  return (
    <div className={`${className} bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400`}>
      <PhotoIcon className="w-8 h-8 mb-2" />
      <span className="text-xs font-medium text-center px-2">No Image Yet</span>
    </div>
  );
};

export default VehicleImage;