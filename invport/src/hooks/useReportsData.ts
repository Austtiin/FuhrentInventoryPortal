'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';

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
      
      const response = await apiFetch('/GetReportsDashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Adapt the Azure Function response to match our expected format
      const adaptedData: ReportsData = {
        totalStats: {
          totalValue: result.totalInventoryValue || 0,
          totalVehicles: result.totalVehicles || 0,
          totalFishHouses: result.totalFishHouses || 0,
          totalTrailers: result.totalTrailers || 0,
          uniqueMakes: result.totalUniqueMakes || 0,
          pendingSales: result.pendingSales || 0,
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
      
      setData(adaptedData);
      setLastUpdated(result.lastUpdated || new Date().toISOString());
    } catch (err) {
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