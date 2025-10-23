/**
 * Dealership-Specific Caching Recommendations
 * 
 * Given your CDN setup and dealership requirements, here's what I recommend:
 */

export const DEALERSHIP_RECOMMENDATIONS = {
  
  /**
   * ❌ DO NOT CACHE (Let CDN handle short-term caching):
   */
  AVOID_CLIENT_CACHE: [
    'inventory-data',      // Vehicle availability changes frequently
    'pricing-info',        // Prices change for promotions
    'vehicle-status',      // Sold/Available changes in real-time
    'user-specific-data',  // Customer inquiries, saved vehicles
  ],

  /**
   * ✅ SAFE TO CACHE CLIENT-SIDE:
   */
  SAFE_CLIENT_CACHE: [
    'image-existence',     // Images rarely change once uploaded
    'vehicle-colors',      // Standard color options don't change often
    'categories',          // Vehicle categories are relatively static
    'dealership-info',     // Contact info, hours, etc.
  ],

  /**
   * 🎯 RECOMMENDED ARCHITECTURE:
   */
  ARCHITECTURE: {
    CDN_LAYER: 'Handle 30-60 second caching of API responses',
    CLIENT_CACHE: 'Only for truly static data (images, config)',
    REAL_TIME: 'Critical data like availability, pricing',
  },

  /**
   * ⚠️ DEALERSHIP-SPECIFIC CONCERNS:
   */
  CONCERNS: [
    'Customer sees "Available" but vehicle was just sold',
    'Cached pricing doesn\'t reflect current promotions', 
    'Multiple customers competing for same vehicle',
    'Staff updates not immediately visible to customers',
  ],

  /**
   * 💡 BEST PRACTICES FOR YOUR SITE:
   */
  BEST_PRACTICES: [
    'Use CDN for short-term API response caching (30-60s)',
    'Implement real-time checks before critical actions',
    'Cache only images and configuration data client-side',
    'Add "Last updated" timestamps to inventory displays',
    'Implement refresh buttons for critical pages',
  ]
};

/**
 * Simplified caching utility - only for truly safe data
 */
export class DealershipCache {
  private static instance: DealershipCache;
  private cache = new Map<string, { data: any; expires: number }>();

  static getInstance() {
    if (!this.instance) {
      this.instance = new DealershipCache();
    }
    return this.instance;
  }

  /**
   * Only cache truly static data
   */
  setStatic(key: string, data: any, ttlMinutes: number = 60) {
    const expires = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, { data, expires });
    console.log(`📦 [Dealership Cache] Cached static data: ${key} (${ttlMinutes}m)`);
  }

  getStatic(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`✅ [Dealership Cache] Cache hit: ${key}`);
    return item.data;
  }

  /**
   * Force refresh - bypass all caches
   */
  clear() {
    this.cache.clear();
    console.log('🧹 [Dealership Cache] All cache cleared');
  }

  /**
   * Get cache stats for monitoring
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}