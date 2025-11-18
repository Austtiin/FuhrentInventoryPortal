import { useState, useEffect, useCallback } from 'react';
import { safeResponseJson } from '@/lib/safeJson';
import { buildApiUrl } from '@/lib/apiClient';
import type { GenericApiResponse } from '@/types/apiResponses';

export interface VehicleImage {
  name: string;
  url: string;
  number: number;
}

interface UseVehicleImagesResult {
  images: VehicleImage[];
  isLoading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<boolean>;
  deleteImage: (imageNumber: number) => Promise<boolean>;
  reorderImages: (newOrder: number[]) => Promise<boolean>;
  refreshImages: () => Promise<void>;
}

/**
 * Hook for managing vehicle images from Azure Blob Storage
 */
export function useVehicleImages(vin: string | undefined, typeId: number): UseVehicleImagesResult {
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch images from API
  const fetchImages = useCallback(async () => {
    if (!vin) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`images/${vin}?typeId=${typeId}`));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      interface ImagesResponse {
        success: boolean;
        images?: VehicleImage[];
        error?: string;
      }
      const result = await safeResponseJson<ImagesResponse>(response);
      
      if (result && result.success) {
        setImages(result.images || []);
      } else {
        setError(result?.error || 'Failed to load images');
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [vin, typeId]);

  // Load images on mount and when VIN/TypeID changes
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Upload a new image with timeout handling
  const uploadImage = useCallback(async (file: File): Promise<boolean> => {
    if (!vin) {
      setError('VIN is required to upload images');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('typeId', typeId.toString());

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout per image

      try {
        const response = await fetch(buildApiUrl(`images/${vin}`), {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await safeResponseJson<GenericApiResponse>(response);
        
        if (result && result.success) {
          // Don't refresh here - let caller refresh after all uploads complete
          return true;
        } else {
          setError(result?.error || 'Failed to upload image');
          return false;
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Upload timed out. Please try uploading fewer images at once.');
        }
        throw fetchErr;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vin, typeId, fetchImages]);

  // Delete an image
  const deleteImage = useCallback(async (imageNumber: number): Promise<boolean> => {
    if (!vin) {
      setError('VIN is required to delete images');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`images/${vin}?imageNumber=${imageNumber}&typeId=${typeId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const result = await safeResponseJson<GenericApiResponse>(response);
      
      if (result && result.success) {
        // Refresh images list
        await fetchImages();
        return true;
      } else {
        setError(result?.error || 'Failed to delete image');
        return false;
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vin, typeId, fetchImages]);

  // Reorder images
  const reorderImages = useCallback(async (newOrder: number[]): Promise<boolean> => {
    if (!vin) {
      setError('VIN is required to reorder images');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`images/${vin}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOrder, typeId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const result = await safeResponseJson<GenericApiResponse>(response);
      
      if (result && result.success) {
        // Refresh images list
        await fetchImages();
        return true;
      } else {
        setError(result?.error || 'Failed to reorder images');
        return false;
      }
    } catch (err) {
      console.error('Error reordering images:', err);
      setError(err instanceof Error ? err.message : 'Failed to reorder images');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [vin, typeId, fetchImages]);

  return {
    images,
    isLoading,
    error,
    uploadImage,
    deleteImage,
    reorderImages,
    refreshImages: fetchImages,
  };
}
