import { useEffect, useState, useCallback } from 'react';
import { getVehicleImageUrl } from '@/lib/imageUtils';

export interface DirectVehicleImage {
  name: string;
  url: string;
  number: number;
}



export function useVehicleImagesDirect(vin: string | undefined, maxImages: number = 20) {
  const [images, setImages] = useState<DirectVehicleImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vin) {
      setImages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const foundImages: DirectVehicleImage[] = [];
      
      // Check images sequentially starting from 1
      for (let i = 1; i <= maxImages; i++) {
        // Try both png and jpg formats
        let imageFound = false;
        
        for (const ext of ['png', 'jpg']) {
          const url = getVehicleImageUrl(vin, i, ext);
          
          try {
            // Check if image exists by making a HEAD request
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              foundImages.push({
                name: `${i}.${ext}`,
                url,
                number: i,
              });
              imageFound = true;
              break; // Found this number, move to next
            }
          } catch {
            // Image doesn't exist, continue checking other formats
          }
        }
        
        // If no image found for this number, stop checking higher numbers
        if (!imageFound) {
          break;
        }
      }
      
      setImages(foundImages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load images');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [vin, maxImages]);

  useEffect(() => {
    load();
  }, [load]);

  return { images, isLoading, error, refreshImages: load } as const;
}
