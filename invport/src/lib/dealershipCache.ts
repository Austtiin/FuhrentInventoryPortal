/**
 * Dealership-Optimized Caching Configuration
 * 
 * Conservative caching approach suitable for automotive dealerships
 * where inventory changes frequently and accuracy is critical
 */

import { useState, useCallback } from 'react';
import { unstable_cache } from 'next/cache';
import { apiFetch } from '@/lib/apiClient';
import { safeResponseJson } from '@/lib/safeJson';

/**
 * Cache configuration for dealership environment
 */
const DEALERSHIP_CACHE_CONFIG = {
  // Very short cache for inventory - only cache for 30 seconds to 1 minute
  INVENTORY_CACHE_DURATION: 30, // 30 seconds
  
  // Medium cache for images - they don't change often
  IMAGE_CACHE_DURATION: 3600, // 1 hour
  
  // Long cache for static data - rarely changes
  STATIC_DATA_CACHE_DURATION: 86400, // 24 hours
  
  // Enable/disable caching per environment
  ENABLE_INVENTORY_CACHE: process.env.NODE_ENV === 'production' && process.env.ENABLE_INVENTORY_CACHE === 'true',
  ENABLE_IMAGE_CACHE: true,
  ENABLE_STATIC_CACHE: true,
};

/**
 * SHORT-TERM inventory cache - only for reducing rapid successive calls
 * Use case: User refreshing page multiple times, CDN not yet populated
 */
export const getShortTermInventoryCache = unstable_cache(
  async () => {
    console.log('🔄 [Short Cache] Fetching inventory (30s cache)...');
    
    const response = await apiFetch('/GrabInventoryAll', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add cache-busting header for critical data
        'X-Force-Fresh': Date.now().toString(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeResponseJson(response);
    console.log('✅ [Short Cache] Inventory cached for 30 seconds');
    return data;
  },
  ['inventory-short-term'],
  {
    revalidate: DEALERSHIP_CACHE_CONFIG.INVENTORY_CACHE_DURATION,
    tags: ['inventory-short'],
  }
);

/**
 * Image existence cache - safe to cache longer
 * Images don't change frequently once uploaded
 */
export const getDealershipImageExists = unstable_cache(
  async (url: string): Promise<boolean> => {
    console.log(`🖼️ [Image Cache] Checking: ${url}`);
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000) // Shorter timeout for dealership
      });
      
      return response.ok;
    } catch {
      return false;
    }
  },
  ['dealer-image-exists'],
  {
    revalidate: DEALERSHIP_CACHE_CONFIG.IMAGE_CACHE_DURATION,
    tags: ['dealer-images'],
  }
);

/**
 * Static configuration cache - safe for long caching
 * Colors, categories, etc. rarely change
 */
export const getCachedStaticConfig = unstable_cache(
  async (configType: 'colors' | 'categories' | 'statuses') => {
    console.log(`⚙️ [Static Cache] Loading ${configType} config`);
    
    // This would fetch from your configuration API
    // For now, return static data
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
  },
  ['static-config'],
  {
    revalidate: DEALERSHIP_CACHE_CONFIG.STATIC_DATA_CACHE_DURATION,
    tags: ['static-config'],
  }
);

/**
 * Dealership-specific hook with conservative caching
 */
export const useDealershipInventory = () => {
  const [useCache, setUseCache] = useState(DEALERSHIP_CACHE_CONFIG.ENABLE_INVENTORY_CACHE);
  
  // Allow runtime toggle of caching
  const toggleCache = useCallback(() => {
    setUseCache((prev: boolean) => !prev);
    console.log(`🔧 [Dealership] Cache ${!useCache ? 'enabled' : 'disabled'}`);
  }, [useCache]);
  
  return {
    // Use very short cache or no cache for inventory
    getCachedInventory: useCache ? getShortTermInventoryCache : null,
    getCachedImageExists: DEALERSHIP_CACHE_CONFIG.ENABLE_IMAGE_CACHE ? getDealershipImageExists : null,
    toggleCache,
    isCacheEnabled: useCache,
    cacheConfig: DEALERSHIP_CACHE_CONFIG,
  };
};

/**
 * Real-time inventory fetcher - always fresh data
 * Use this for critical operations like purchasing decisions
 */
export const getRealTimeInventory = async () => {
  console.log('🔴 [Real-Time] Fetching fresh inventory data...');
  
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

export { DEALERSHIP_CACHE_CONFIG };