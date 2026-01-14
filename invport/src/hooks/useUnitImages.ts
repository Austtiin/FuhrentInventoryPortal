import { useState, useEffect, useCallback } from 'react';
import { safeResponseJson } from '@/lib/safeJson';
import { apiFetch } from '@/lib/apiClient';
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
      console.log(`📥 [useUnitImages] Fetching images for UnitID=${idStr}`);
      // Add timestamp to API URL to bust any proxy/CDN caching
      const timestamp = Date.now();
      const response = await apiFetch(`units/${encodeURIComponent(idStr)}/images?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      console.log(`📥 [useUnitImages] Response status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const txt = await response.text();
        console.error('❌ [useUnitImages] Error body:', txt);
        throw new Error(`List images failed ${response.status}: ${txt}`);
      }
      const list = await safeResponseJson<Array<{ name: string; url: string }>>(response);
      console.log('📦 [useUnitImages] Raw API response:', list);
      
      // API returns array of { name, url } - parse number from name and add cache buster to URLs
      const mapped = (Array.isArray(list) ? list : [])
        .map(item => {
          // Add timestamp cache buster to blob URL to prevent browser caching
          const cacheBustedUrl = item.url + (item.url.includes('?') ? '&' : '?') + `_cb=${timestamp}`;
          return {
            name: item.name,
            url: cacheBustedUrl,
            number: parseNumberFromName(item.name),
          };
        })
        .filter(x => x.number > 0)
        .sort((a, b) => a.number - b.number);
      
      console.log('🧮 [useUnitImages] Processed images:', mapped);
      console.log(`✅ [useUnitImages] Found ${mapped.length} valid images, lowest number: ${mapped[0]?.number || 'none'}`);
      setImages(mapped);
      setError(null);
    } catch (e) {
      console.error('❌ [useUnitImages] Failed to fetch images:', e);
      const errorMsg = e instanceof Error ? e.message : 'Failed to load images';
      setError(errorMsg);
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

