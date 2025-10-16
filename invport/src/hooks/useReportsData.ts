'use client';

import { useState, useEffect, useCallback } from 'react';

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
      
      const response = await fetch('/api/reports/analytics');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reports data');
      }
      
      setData(result.data);
      setLastUpdated(result.lastUpdated);
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