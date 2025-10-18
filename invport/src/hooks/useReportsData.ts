'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { safeResponseJson } from '@/lib/safeJson';
import { rateLimiter, RATE_LIMITS } from '@/lib/rateLimiter';

export interface ReportsData {
  totalStats: {
    totalValue: number;
    totalVehicles: number;
    totalFishHouses: number;
    totalTrailers: number;
    uniqueMakes: number;
    pendingSales: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    uniqueCategories: number;
    avgYear: number;
    oldestYear: number;
    newestYear: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalValue: number;
    avgPrice: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    totalValue: number;
    percentage: number;
  }>;
  priceStats: {
    vehiclesWithPrice: number;
    vehiclesWithoutPrice: number;
    under10k: number;
    range10k25k: number;
    range25k50k: number;
    over50k: number;
  };
  yearDistribution: Array<{
    Year: number;
    count: number;
    totalValue: number;
  }>;
  makeDistribution: Array<{
    make: string;
    count: number;
    totalValue: number;
    avgPrice: number;
  }>;
  trendData: Array<{
    date: string;
    vehiclesAdded: number;
  }>;
}

export function useReportsData() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Rate limit: Max 3 calls per 10 seconds
      await rateLimiter.throttle('reports', RATE_LIMITS.REPORTS);
      
      // Enable retry for reports (max 3 attempts)
      const response = await apiFetch('/reports/dashboard', {
        maxRetries: 3,
        retryDelay: 1000
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const result = await safeResponseJson<Record<string, unknown>>(response);
      
      // Debug: Log the actual response structure
      console.log('%c🔍 [Reports] Raw API Response:', 'color: #00BCD4; font-weight: bold');
      console.log(result);
      console.log('%c🔍 [Reports] Response type:', 'color: #00BCD4; font-weight: bold', typeof result);
      console.log('%c🔍 [Reports] Response keys:', 'color: #00BCD4; font-weight: bold', Object.keys(result || {}));
      
      // Handle direct response (like dashboard) or wrapped response
      let data: Record<string, unknown> = {};
      
      // If it's wrapped in success/data structure, unwrap it
      if (result && typeof result === 'object' && 'data' in result) {
        data = (result.data as Record<string, unknown>) || {};
        console.log('%c🔍 [Reports] Unwrapped from .data:', 'color: #00BCD4; font-weight: bold');
        console.log(data);
      } else if (result && typeof result === 'object' && 'result' in result) {
        data = (result.result as Record<string, unknown>) || {};
        console.log('%c🔍 [Reports] Unwrapped from .result:', 'color: #00BCD4; font-weight: bold');
        console.log(data);
      } else if (result && typeof result === 'object') {
        // Direct response like dashboard
        data = result;
        console.log('%c🔍 [Reports] Using direct response:', 'color: #00BCD4; font-weight: bold');
        console.log(data);
      }
      
      console.log('%c🔍 [Reports] Final Extracted Data:', 'color: #00BCD4; font-weight: bold');
      console.log(data);
      
      // Adapt the Azure Function response to match our expected format
      const adaptedData: ReportsData = {
        totalStats: {
          totalValue: Number(data.totalInventoryValue || data.totalValue || 0),
          totalVehicles: Number(data.totalVehicles || data.totalItems || 0),
          totalFishHouses: Number(data.totalFishHouses || 0),
          totalTrailers: Number(data.totalTrailers || 0),
          uniqueMakes: Number(data.totalUniqueMakes || data.uniqueMakes || 0),
          pendingSales: Number(data.pendingSales || 0),
          avgPrice: 0, // Calculated client-side if needed
          minPrice: 0,
          maxPrice: 0,
          uniqueCategories: 0,
          avgYear: 0,
          oldestYear: 0,
          newestYear: 0,
        },
        categoryBreakdown: [],
        statusBreakdown: [],
        priceStats: {
          vehiclesWithPrice: 0,
          vehiclesWithoutPrice: 0,
          under10k: 0,
          range10k25k: 0,
          range25k50k: 0,
          over50k: 0,
        },
        yearDistribution: [],
        makeDistribution: [],
        trendData: [],
      };
      
      console.log('%c🔍 [Reports] Adapted Data:', 'color: #4CAF50; font-weight: bold');
      console.log(adaptedData);
      
      setData(adaptedData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('[Reports] Error fetching reports data:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        fullError: err
      });
      setError(err instanceof Error ? err : new Error('Failed to fetch reports data'));
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsValidating(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    lastUpdated,
    error,
    isLoading,
    isValidating,
    refresh,
  };
}