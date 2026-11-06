import { useState, useEffect, useCallback, useRef } from 'react';
import { safeResponseJson } from '@/lib/safeJson';
import { apiFetch } from '@/lib/apiClient';
import { createUnitImageCache, parseUnitImages, type UnitImage } from '@/lib/unitImageCache';
export type { UnitImage } from '@/lib/unitImageCache';

const imageCache = createUnitImageCache(async (id, version) => {
  const response = await apiFetch(`units/${encodeURIComponent(id)}/images`);
  if (!response.ok) throw new Error(`List images failed ${response.status}: ${await response.text()}`);
  return parseUnitImages(await safeResponseJson<unknown>(response), version);
});

interface UseUnitImagesResult {
  images: UnitImage[];
  isLoading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<boolean>;
  deleteImage: (imageNumber: number) => Promise<boolean>;
  renameImage: (oldNumber: number, newNumber: number, options?: { skipRefresh?: boolean }) => Promise<boolean>;
  refreshImages: () => Promise<void>;
}

export function useUnitImages(unitId: string | number | undefined): UseUnitImagesResult {
  const [images, setImages] = useState<UnitImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idStr = unitId != null ? String(unitId) : undefined;
  const requestId = useRef(0);
  const [loadedId, setLoadedId] = useState<string | undefined>(undefined);

  const fetchImages = useCallback(async (force = false) => {
    const request = ++requestId.current;
    if (!idStr) {
      setImages([]);
      setLoadedId(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }
    const cached = imageCache.peek(idStr);
    if (cached) {
      setImages(cached);
      setLoadedId(idStr);
    }
    setIsLoading(!cached);
    setError(null);
    try {
      const mapped = await imageCache.get(idStr, force);
      if (request !== requestId.current) return;
      setImages(mapped);
      setLoadedId(idStr);
      setError(null);
    } catch (e) {
      if (request !== requestId.current) return;
      console.error('❌ [useUnitImages] Failed to fetch images:', e);
      const errorMsg = e instanceof Error ? e.message : 'Failed to load images';
      setError(errorMsg);
      setImages(cached ?? []);
      setLoadedId(idStr);
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  }, [idStr]);

  useEffect(() => {
    const requests = requestId;
    void fetchImages();
    const timer = idStr ? window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchImages();
    }, 5 * 60 * 1000) : undefined;
    return () => {
      window.clearInterval(timer);
      requests.current++;
    };
  }, [fetchImages, idStr]);
  const refreshImages = useCallback(() => fetchImages(true), [fetchImages]);

  const uploadImage = useCallback(async (file: File): Promise<boolean> => {
    if (!idStr) {
      setError('UnitID is required to upload images');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`📤 Uploading to /units/${idStr}/images - File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);
      
      // Per documentation, upload expects raw image body with proper Content-Type
      const res = await apiFetch(`units/${encodeURIComponent(idStr)}/images`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: file,
      });
      
      console.log(`📡 Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const txt = await res.text();
        console.error(`❌ Upload failed with status ${res.status}:`, txt);
        throw new Error(`Upload failed ${res.status}: ${txt}`);
      }
      
      // Parse the success response to confirm upload completed
      const result = await safeResponseJson<{ success?: boolean; name?: string; url?: string; error?: boolean; message?: string }>(res);
      console.log('📦 API Response:', result);
      
      if (result?.error) {
        throw new Error(result.message || 'Upload returned error');
      }
      
      // API may return either { success: true, name, url } OR just { name, url }
      // If we got a 200/201 response with name and url, consider it successful
      if (!result || (!result.name && !result.success)) {
        throw new Error('Upload did not return valid response');
      }
      
      console.log(`✅ Upload confirmed by API: ${result.name} at ${result.url}`);
      imageCache.invalidate(idStr);
      
      // No need to refresh immediately - let the caller handle batch refresh
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to upload image';
      console.error('❌ Upload error:', errorMsg, e);
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [idStr]);

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
      const res = await apiFetch(`units/${encodeURIComponent(idStr)}/images/${encodeURIComponent(img.name)}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed ${res.status}: ${txt}`);
      }
      // If body is not a standard envelope, consider HTTP 2xx as success
      imageCache.invalidate(idStr);
      await refreshImages();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [idStr, images, refreshImages]);

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
      const res = await apiFetch(`units/${encodeURIComponent(idStr)}/images/${encodeURIComponent(oldName)}/rename/${encodeURIComponent(newName)}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Rename failed ${res.status}: ${txt}`);
      }
      imageCache.invalidate(idStr);
      if (!options?.skipRefresh) {
        await refreshImages();
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename image');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [idStr, images, refreshImages]);

  return {
    images: loadedId === idStr ? images : (idStr ? imageCache.peek(idStr) ?? [] : []),
    isLoading: isLoading || (!!idStr && loadedId !== idStr && !imageCache.peek(idStr)),
    error: loadedId === idStr ? error : null,
    uploadImage,
    deleteImage,
    renameImage,
    refreshImages,
  };
}
