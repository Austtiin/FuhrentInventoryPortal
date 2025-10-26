import { useState, useEffect, useCallback } from 'react';
import { safeResponseJson } from '@/lib/safeJson';
import { buildApiUrl } from '@/lib/apiClient';
// no-op

export interface UnitImage {
  name: string; // e.g., "1.png"
  url: string;  // full public URL
  number: number; // parsed from name
}

interface UseUnitImagesResult {
  images: UnitImage[];
  isLoading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<boolean>;
  deleteImage: (imageNumber: number) => Promise<boolean>;
  renameImage: (oldNumber: number, newNumber: number, options?: { skipRefresh?: boolean }) => Promise<boolean>;
  refreshImages: () => Promise<void>;
}

function parseNumberFromName(name: string): number {
  const m = name.match(/^(\d+)\.(png|jpg|jpeg|webp|gif)$/i);
  return m ? parseInt(m[1], 10) : 0;
}

export function useUnitImages(unitId: string | number | undefined): UseUnitImagesResult {
  const [images, setImages] = useState<UnitImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idStr = unitId != null ? String(unitId) : undefined;

  const fetchImages = useCallback(async () => {
    if (!idStr) {
      setImages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(`units/${encodeURIComponent(idStr)}/images`), {
        cache: 'no-store'
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`List images failed ${response.status}: ${txt}`);
      }
      const list = await safeResponseJson<Array<{ name: string; url: string }>>(response);
      const mapped = (Array.isArray(list) ? list : []).map(item => ({
        name: item.name,
        url: item.url,
        number: parseNumberFromName(item.name),
      }))
      .filter(x => x.number > 0)
      .sort((a, b) => a.number - b.number);
      setImages(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load images');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [idStr]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const uploadImage = useCallback(async (file: File): Promise<boolean> => {
    if (!idStr) {
      setError('UnitID is required to upload images');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Per documentation, upload expects raw image body with proper Content-Type
      const res = await fetch(buildApiUrl(`units/${encodeURIComponent(idStr)}/images`), {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed ${res.status}: ${txt}`);
      }
      // Some implementations may not return a standard envelope; treat HTTP 2xx as success
      // and refresh the list regardless of body shape.
      await fetchImages();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [idStr, fetchImages]);

  const deleteImage = useCallback(async (imageNumber: number): Promise<boolean> => {
    if (!idStr) {
      setError('UnitID is required to delete images');
      return false;
    }
    // Find name by number
    const img = images.find(i => i.number === imageNumber);
    if (!img) {
      setError('Image not found');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(`units/${encodeURIComponent(idStr)}/images/${encodeURIComponent(img.name)}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed ${res.status}: ${txt}`);
      }
      // If body is not a standard envelope, consider HTTP 2xx as success
      await fetchImages();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [idStr, images, fetchImages]);

  const renameImage = useCallback(async (oldNumber: number, newNumber: number, options?: { skipRefresh?: boolean }): Promise<boolean> => {
    if (!idStr) {
      setError('UnitID is required to rename images');
      return false;
    }
    const meta = images.find(i => i.number === oldNumber);
    if (!meta) {
      setError('Source image not found');
      return false;
    }
    const extMatch = meta.name.match(/\.(png|jpg|jpeg|webp|gif)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    const oldName = `${oldNumber}.${ext}`;
    const newName = `${newNumber}.${ext}`;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl(`units/${encodeURIComponent(idStr)}/images/${encodeURIComponent(oldName)}/rename/${encodeURIComponent(newName)}`), {
        method: 'PUT',
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Rename failed ${res.status}: ${txt}`);
      }
      if (!options?.skipRefresh) {
        await fetchImages();
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [idStr, images, fetchImages]);

  return {
    images,
    isLoading,
    error,
    uploadImage,
    deleteImage,
    renameImage,
    refreshImages: fetchImages,
  };
}
