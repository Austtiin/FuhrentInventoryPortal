/**
 * Rate Limiter for API Calls
 * Prevents excessive API calls by enforcing delays between requests
 */

interface RateLimitConfig {
  maxCalls: number;      // Max calls allowed in the time window
  timeWindow: number;    // Time window in milliseconds
  minDelay?: number;     // Minimum delay between calls (ms)
}

interface CallRecord {
  timestamp: number;
  key: string;
}

class RateLimiter {
  private callHistory: Map<string, CallRecord[]> = new Map();
  private pendingCalls: Map<string, Promise<void>> = new Map();

  /**
   * Check if a call is allowed based on rate limit rules
   * @param key - Unique identifier for the endpoint/resource
   * @param config - Rate limit configuration
   * @returns Promise that resolves when call is allowed
   */
  async throttle(key: string, config: RateLimitConfig): Promise<void> {
    const now = Date.now();
    const { maxCalls, timeWindow, minDelay = 0 } = config;

    // Get or initialize call history for this key
    if (!this.callHistory.has(key)) {
      this.callHistory.set(key, []);
    }

    const history = this.callHistory.get(key)!;

    // Remove calls outside the time window
    const validCalls = history.filter(
      record => now - record.timestamp < timeWindow
    );
    this.callHistory.set(key, validCalls);

    // Check if we've hit the rate limit
    if (validCalls.length >= maxCalls) {
      const oldestCall = validCalls[0];
      const waitTime = timeWindow - (now - oldestCall.timestamp);
      
      console.log(
        `🛑 [Rate Limit] ${key} - Max ${maxCalls} calls per ${timeWindow}ms reached. Waiting ${waitTime}ms...`
      );
      
      await this.delay(waitTime);
      return this.throttle(key, config); // Retry after waiting
    }

    // Check minimum delay between calls
    if (minDelay > 0 && validCalls.length > 0) {
      const lastCall = validCalls[validCalls.length - 1];
      const timeSinceLastCall = now - lastCall.timestamp;
      
      if (timeSinceLastCall < minDelay) {
        const waitTime = minDelay - timeSinceLastCall;
        console.log(
          `⏱️ [Rate Limit] ${key} - Enforcing ${minDelay}ms delay. Waiting ${waitTime}ms...`
        );
        await this.delay(waitTime);
      }
    }

    // Record this call
    validCalls.push({ timestamp: Date.now(), key });
    this.callHistory.set(key, validCalls);
  }

  /**
   * Debounce a function call - only execute after calls stop for specified time
   * @param key - Unique identifier
   * @param fn - Function to execute
   * @param delay - Delay in milliseconds
   */
  debounce<T>(key: string, fn: () => Promise<T>, delay: number): Promise<T> {
    // Cancel any pending call
    if (this.pendingCalls.has(key)) {
      console.log(`🔄 [Debounce] ${key} - Cancelling previous call`);
    }

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        this.pendingCalls.delete(key);
        try {
          console.log(`✅ [Debounce] ${key} - Executing after ${delay}ms`);
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      // Store promise so we can cancel it
      this.pendingCalls.set(key, Promise.resolve());
    });
  }

  /**
   * Clear rate limit history for a specific key or all keys
   */
  clear(key?: string): void {
    if (key) {
      this.callHistory.delete(key);
      this.pendingCalls.delete(key);
      console.log(`🧹 [Rate Limit] Cleared history for ${key}`);
    } else {
      this.callHistory.clear();
      this.pendingCalls.clear();
      console.log('🧹 [Rate Limit] Cleared all history');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current call count for a key
   */
  getCallCount(key: string, timeWindow: number): number {
    const history = this.callHistory.get(key) || [];
    const now = Date.now();
    return history.filter(record => now - record.timestamp < timeWindow).length;
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Preset configurations
export const RATE_LIMITS = {
  // Dashboard: Max 2 calls per 5 seconds (prevent spam)
  DASHBOARD: {
    maxCalls: 2,
    timeWindow: 5000,
    minDelay: 2000
  },
  
  // Reports: Max 3 calls per 10 seconds
  REPORTS: {
    maxCalls: 3,
    timeWindow: 10000,
    minDelay: 3000
  },
  
  // Inventory: Max 5 calls per 10 seconds
  INVENTORY: {
    maxCalls: 5,
    timeWindow: 10000,
    minDelay: 1000
  },
  
  // Status checks: Max 10 calls per 5 seconds (multiple items on page)
  STATUS_CHECK: {
    maxCalls: 10,
    timeWindow: 5000,
    minDelay: 100
  },
  
  // Image operations: Max 3 per 5 seconds
  IMAGES: {
    maxCalls: 3,
    timeWindow: 5000,
    minDelay: 500
  },
  
  // Write operations (add/update/delete): Max 2 per 3 seconds
  WRITE: {
    maxCalls: 2,
    timeWindow: 3000,
    minDelay: 1000
  }
} as const;
