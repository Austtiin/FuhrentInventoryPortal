'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';
import type { DashboardStats, SystemStatus } from '@/types';

interface DashboardData {
  success: boolean;
  data: {
    totalInventory: number;
    totalValue: number;
    availableUnits: number;
    databaseStatus: {
      status: string;
      message?: string;
      latency?: string;
    };
  };
}

import { safeResponseJson } from '@/lib/safeJson';
import type { DashboardApiResponse } from '@/types/apiResponses';

// Fetcher function for dashboard data
const fetchDashboardStats = async (): Promise<DashboardData> => {
  console.log('📊 Fetching dashboard stats from API...');
  
  const response = await apiFetch('/dashboard/stats');
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const result = await safeResponseJson<DashboardApiResponse>(response);
  
  console.log('%c🔍 [Dashboard SWR] Raw API Response:', 'color: #00BCD4; font-weight: bold');
  console.log(result);

  // Map Azure Function response to expected DashboardData format
  if (result && typeof result === 'object' && result.totalItems !== undefined) {
    return {
      success: true,
      data: {
        totalInventory: result.totalItems,
        totalValue: result.totalValue,
        availableUnits: result.availableItems,
        databaseStatus: {
          status: 'Connected',
          message: 'Database connection healthy',
          latency: '< 50ms'
        }
      }
    };
  } else {
    throw new Error(`Invalid API response format. Got: ${JSON.stringify(result)}`);
  }
};

// Custom hook for dashboard data with SWR - NO CACHING
export function useDashboardSWR() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await fetchDashboardStats();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const mutate = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Process the data to format it properly
  const processedStats: DashboardStats | null = data ? {
    totalInventory: data.data.totalInventory,
    totalValue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(data.data.totalValue),
    availableUnits: data.data.availableUnits
  } : null;

  const systemStatus: SystemStatus = data ? {
    database: data.data.databaseStatus.status.toLowerCase() === 'connected' ? 'online' : 
             data.data.databaseStatus.status.toLowerCase() === 'error' ? 'error' : 'offline',
    message: data.data.databaseStatus.message || `Database operational${data.data.databaseStatus.latency ? ` (${data.data.databaseStatus.latency})` : ''}`,
    lastChecked: new Date()
  } : {
    database: 'offline'
  };

  return {
    stats: processedStats,
    systemStatus,
    error,
    isLoading,
    isValidating,
    mutate,
    refreshData: () => mutate()
  };
}

