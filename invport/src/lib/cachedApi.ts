/**
 * Cached API Operations using Next.js unstable_cache
 * 
 * These functions provide cached versions of expensive operations
 * like inventory fetching and image existence checking
 */

import { unstable_cache } from 'next/cache';
import { apiFetch } from '@/lib/apiClient';
import { safeResponseJson } from '@/lib/safeJson';
import type { InventoryApiResponse } from '@/types/apiResponses';

/**
 * Cached inventory fetch with configurable cache duration
 */
export const getCachedInventory = unstable_cache(
  async () => {
    console.log('🔄 [Cache Miss] Fetching inventory data...');
    
    try {
      const response = await apiFetch('/GrabInventoryAll', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await safeResponseJson<InventoryApiResponse>(response);
      
      console.log('✅ [Cache] Inventory data fetched and cached');
      return data;
    } catch (error) {
      console.error('❌ [Cache] Error fetching inventory:', error);
      throw error;
    }
  },
  ['inventory-all'], // Cache key
  {
    revalidate: 300, // Revalidate every 5 minutes (300 seconds)
    tags: ['inventory', 'vehicles'], // Cache tags for invalidation
  }
);

/**
 * Cached image existence check with longer cache duration
 */
export const getCachedImageExists = unstable_cache(
  async (url: string): Promise<boolean> => {
    console.log(`🖼️ [Cache Miss] Checking image existence: ${url}`);
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        // Add timeout for image checks
        signal: AbortSignal.timeout(5000)
      });
      
      const exists = response.ok;
      console.log(`✅ [Cache] Image ${url} exists: ${exists}`);
      return exists;
    } catch (error) {
      console.log(`❌ [Cache] Image check failed for ${url}:`, error);
      return false;
    }
  },
  ['image-exists'], // Base cache key (URL will be appended)
  {
    revalidate: 3600, // Revalidate every hour (3600 seconds) - images don't change often
    tags: ['images', 'vehicle-images'], // Cache tags for invalidation
  }
);

/**
 * Cached vehicle images lookup with medium cache duration
 */
export const getCachedVehicleImages = unstable_cache(
  async (vin: string, maxImages: number = 10): Promise<string[]> => {
    console.log(`🖼️ [Cache Miss] Finding images for VIN: ${vin}`);
    
    const { getVehicleImageUrl } = await import('@/lib/imageUtils');
    const availableImages: string[] = [];
    const extensions = ['png', 'jpg', 'jpeg'];
    
    for (let i = 1; i <= maxImages; i++) {
      for (const ext of extensions) {
        const url = getVehicleImageUrl(vin, i, ext);
        const exists = await getCachedImageExists(url);
        
        if (exists) {
          availableImages.push(url);
          break; // Found image for this number, move to next number
        }
      }
    }
    
    console.log(`✅ [Cache] Found ${availableImages.length} images for VIN: ${vin}`);
    return availableImages;
  },
  ['vehicle-images'], // Base cache key (VIN and maxImages will be appended)
  {
    revalidate: 1800, // Revalidate every 30 minutes (1800 seconds)
    tags: ['images', 'vehicle-images'], // Cache tags for invalidation
  }
);

/**
 * Cache invalidation utilities
 * Note: These functions are placeholders for manual cache invalidation
 * In a production environment, you might implement these via API routes
 */
export const cacheUtils = {
  /**
   * Log cache invalidation request (implement via API route for production)
   */
  logCacheInvalidation(type: string, identifier?: string) {
    console.log(`🔄 [Cache] Invalidation requested for ${type}${identifier ? ` (${identifier})` : ''}`);
    // In production, this could trigger an API call to invalidate cache
  },

  /**
   * Request inventory cache invalidation
   */
  async revalidateInventory() {
    this.logCacheInvalidation('inventory');
    // Implementation: Call API route that triggers revalidateTag('inventory')
  },

  /**
   * Request image cache invalidation
   */
  async revalidateImages() {
    this.logCacheInvalidation('images');
    // Implementation: Call API route that triggers revalidateTag('images')
  },

  /**
   * Request specific vehicle images cache invalidation
   */
  async revalidateVehicleImages(vin: string) {
    this.logCacheInvalidation('vehicle-images', vin);
    // Implementation: Call API route that triggers revalidateTag(`vehicle-images-${vin}`)
  }
};

/**
 * Cache statistics and monitoring
 */
export const cacheStats = {
  /**
   * Get cache hit/miss statistics (for development)
   */
  getStats() {
    // This would be implemented with a proper cache monitoring solution
    // For now, just log that stats are being requested
    console.log('📊 [Cache] Stats requested - implement with monitoring solution');
    return {
      hits: 0,
      misses: 0,
      hitRate: 0
    };
  }
};