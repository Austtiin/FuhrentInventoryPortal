/**
 * Centralized server-side API helpers (non-cached)
 *
 * This module consolidates inventory and image helper functions used
 * across the app. These helpers intentionally perform fresh network
 * requests (no caching) because the Admin portal requires real-time data.
 */

import { apiFetch } from '@/lib/apiClient';
import { safeResponseJson } from '@/lib/safeJson';
import type { InventoryApiResponse } from '@/types/apiResponses';

/**
 * Fetch the full inventory using the GrabInventoryAll endpoint.
 * Always performs a fresh request.
 */
export async function getInventory(): Promise<InventoryApiResponse | null> {
  console.log('🔄 [serverApi] Fetching inventory (fresh)...');
  try {
    const response = await apiFetch('/GrabInventoryAll', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeResponseJson<InventoryApiResponse>(response);
    return data;
  } catch (err) {
    console.error('❌ [serverApi] getInventory error:', err);
    throw err;
  }
}

/**
 * Very short-term inventory fetch. Useful for reducing rapid successive
 * client-side calls but still returns fresh data on each invocation.
 */
export const getInventoryShort = async () => {
  console.log('🔄 [serverApi] Fetching inventory (short fetch, fresh)...');

  const response = await apiFetch('/GrabInventoryAll', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Force-Fresh': Date.now().toString(),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await safeResponseJson(response);
  return data;
};

/**
 * Check whether a remote image URL exists (HEAD request).
 * Returns boolean and swallows errors (false if unreachable).
 */
export async function imageExists(url: string): Promise<boolean> {
  console.log(`🖼️ [serverApi] Checking image existence: ${url}`);
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch (err) {
    console.log(`❌ [serverApi] imageExists error for ${url}:`, err);
    return false;
  }
}

/**
 * Find available vehicle images for a VIN by probing candidate URLs.
 */
export async function getVehicleImages(vin: string, maxImages: number = 10): Promise<string[]> {
  console.log(`🖼️ [serverApi] Finding images for VIN: ${vin}`);
  const { getVehicleImageUrl } = await import('@/lib/imageUtils');
  const availableImages: string[] = [];
  const extensions = ['png', 'jpg', 'jpeg'];

  for (let i = 1; i <= maxImages; i++) {
    for (const ext of extensions) {
      const url = getVehicleImageUrl(vin, i, ext);
      const exists = await imageExists(url);

      if (exists) {
        availableImages.push(url);
        break; // Found an image for this index
      }
    }
  }

  console.log(`✅ [serverApi] Found ${availableImages.length} images for VIN: ${vin}`);
  return availableImages;
}

/**
 * Convenience delegation used by dealership helpers.
 */
export const getDealershipImageExists = async (url: string) => imageExists(url);

/**
 * Static configuration loader (colors, categories, statuses)
 */
export const getStaticConfig = async (configType: 'colors' | 'categories' | 'statuses') => {
  switch (configType) {
    case 'colors':
      return ['Red', 'Blue', 'Black', 'White', 'Silver', 'Gray'];
    case 'categories':
      return ['Sedan', 'SUV', 'Truck', 'Coupe'];
    case 'statuses':
      return ['Available', 'Sold', 'Pending'];
    default:
      return [];
  }
};

/**
 * Real-time inventory fetch with explicit no-cache headers.
 */
export const getRealTimeInventory = async () => {
  console.log('🔴 [serverApi] Fetching real-time inventory (no-cache)...');
  const response = await apiFetch('/GrabInventoryAll', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Timestamp': Date.now().toString(),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await safeResponseJson(response);
};

/**
 * Simple cache utilities retained for compatibility with tooling that
 * may reference cache actions. These functions do not implement a real
 * cache — they log requested operations so you can wire them to a
 * real invalidation mechanism if needed.
 */
export const cacheUtils = {
  logCacheInvalidation(type: string, identifier?: string) {
    console.log(`🔄 [serverApi][Cache] Invalidation requested for ${type}${identifier ? ` (${identifier})` : ''}`);
  },
  async revalidateInventory() {
    this.logCacheInvalidation('inventory');
  },
  async revalidateImages() {
    this.logCacheInvalidation('images');
  },
  async revalidateVehicleImages(vin: string) {
    this.logCacheInvalidation('vehicle-images', vin);
  },
};

export const cacheStats = {
  getStats() {
    console.log('📊 [serverApi][Cache] Stats requested');
    return { hits: 0, misses: 0, hitRate: 0 };
  },
};

