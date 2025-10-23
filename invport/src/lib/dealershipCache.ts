/**
 * Dealership-Optimized Caching Configuration
 * 
 * Conservative caching approach suitable for automotive dealerships
 * where inventory changes frequently and accuracy is critical
 */

import { useState, useCallback } from 'react';
import { imageExists as serverImageExists, getInventoryShort, getDealershipImageExists as serverGetDealershipImageExists } from '@/lib/serverApi';

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
// getInventoryShort imported from serverApi (fresh, short fetch)

/**
 * Image existence cache - safe to cache longer
 * Images don't change frequently once uploaded
 */
// getDealershipImageExists delegates to serverApi
export const getDealershipImageExists = async (url: string): Promise<boolean> => {
  return serverGetDealershipImageExists ? serverGetDealershipImageExists(url) : serverImageExists(url);
};

/**
 * Static configuration cache - safe for long caching
 * Colors, categories, etc. rarely change
 */
// getStaticConfig delegated to serverApi

// Backwards-compat alias
// Keep only the new `getStaticConfig` name to avoid cached-* naming confusion

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
    // Expose the short direct fetch for callers when they opt-in
    getCachedInventory: useCache ? getInventoryShort : null,
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
// getRealTimeInventory delegated to serverApi

export { DEALERSHIP_CACHE_CONFIG };

