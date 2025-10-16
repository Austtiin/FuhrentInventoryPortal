import { useState, useEffect, useCallback, useRef } from 'react';

interface SWROptions {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  errorRetryCount?: number;
  errorRetryInterval?: number;
}

interface SWRResponse<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | Promise<T>) => Promise<T | undefined>;
  refresh: () => Promise<void>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

// Global cache to store data across components
const cache = new Map<string, CacheEntry<unknown>>();

// Global fetch promises to dedupe requests
const fetchPromises = new Map<string, Promise<unknown>>();

export function useSWR<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  options: SWROptions = {}
): SWRResponse<T> {
  const {
    refreshInterval = 0,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000, // 2 seconds
    errorRetryCount = 3,
    errorRetryInterval = 1000
  } = options;

  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  
  const retryCountRef = useRef(0);
  const refreshTimeoutRef = useRef<number | undefined>(undefined);

  // Check if cache is stale (5 minutes = 300,000ms)
  const isCacheStale = useCallback((timestamp: number) => {
    return Date.now() - timestamp > 300000; // 5 minutes
  }, []);

  // Check if we should dedupe the request
  const shouldDedupe = useCallback((timestamp: number) => {
    return Date.now() - timestamp < dedupingInterval;
  }, [dedupingInterval]);

  const fetchData = useCallback(async (key: string, isBackground = false): Promise<T | undefined> => {
    if (!isBackground) {
      setIsValidating(true);
    }

    try {
      // Check if there's already a pending request for this key
      if (fetchPromises.has(key)) {
        const result = await fetchPromises.get(key) as T;
        if (!isBackground) {
          setData(result);
          setError(null);
          retryCountRef.current = 0;
        }
        return result;
      }

      // Create new fetch promise
      const fetchPromise = fetcher(key);
      fetchPromises.set(key, fetchPromise);

      const result = await fetchPromise;
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        isStale: false
      });

      // Clean up fetch promise
      fetchPromises.delete(key);

      if (!isBackground) {
        setData(result);
        setError(null);
        setIsLoading(false);
        retryCountRef.current = 0;
      }

      console.log(`📦 SWR: Cached data for key "${key}"`);
      return result;

    } catch (err) {
      fetchPromises.delete(key);
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`❌ SWR: Fetch failed for key "${key}":`, error);

      if (!isBackground) {
        setError(error);
        setIsLoading(false);
        
        // Retry logic
        if (retryCountRef.current < errorRetryCount) {
          retryCountRef.current++;
          console.log(`🔄 SWR: Retrying... (${retryCountRef.current}/${errorRetryCount})`);
          
          setTimeout(() => {
            fetchData(key, isBackground);
          }, errorRetryInterval * retryCountRef.current);
        }
      }
      
      throw error;
    } finally {
      if (!isBackground) {
        setIsValidating(false);
      }
    }
  }, [fetcher, errorRetryCount, errorRetryInterval]);

  const mutate = useCallback(async (newData?: T | Promise<T>): Promise<T | undefined> => {
    if (!key) return;

    try {
      setIsValidating(true);

      if (newData !== undefined) {
        const resolvedData = await Promise.resolve(newData);
        
        // Update cache immediately
        cache.set(key, {
          data: resolvedData,
          timestamp: Date.now(),
          isStale: false
        });
        
        setData(resolvedData);
        setError(null);
        
        return resolvedData;
      } else {
        // Revalidate by fetching fresh data
        return await fetchData(key);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [key, fetchData]);

  const refresh = useCallback(async () => {
    if (!key) return;
    await fetchData(key);
  }, [key, fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (!key) {
      setIsLoading(false);
      return;
    }

    const cached = cache.get(key);
    
    if (cached) {
      // Use cached data immediately
      setData(cached.data as T);
      setError(null);
      setIsLoading(false);

      // Check if we need to revalidate in background
      if (isCacheStale(cached.timestamp)) {
        console.log(`🔄 SWR: Cache stale for "${key}", revalidating in background...`);
        fetchData(key, true).catch(() => {
          // Silent fail for background revalidation
        });
      } else if (!shouldDedupe(cached.timestamp)) {
        console.log(`📦 SWR: Using fresh cache for "${key}"`);
      }
    } else {
      // No cache, fetch data
      console.log(`🔄 SWR: No cache for "${key}", fetching...`);
      fetchData(key).catch(() => {
        // Error handling is done in fetchData
      });
    }
  }, [key, fetchData, isCacheStale, shouldDedupe]);

  // Auto refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && key) {
      refreshTimeoutRef.current = window.setInterval(() => {
        fetchData(key, true).catch(() => {
          // Silent fail for auto refresh
        });
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, key, fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus || !key) return;

    const handleFocus = () => {
      const cached = cache.get(key);
      if (cached && isCacheStale(cached.timestamp)) {
        fetchData(key, true).catch(() => {
          // Silent fail for focus revalidation
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, key, fetchData, isCacheStale]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect || !key) return;

    const handleOnline = () => {
      const cached = cache.get(key);
      if (cached && isCacheStale(cached.timestamp)) {
        fetchData(key, true).catch(() => {
          // Silent fail for reconnect revalidation
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, key, fetchData, isCacheStale]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh
  };
}