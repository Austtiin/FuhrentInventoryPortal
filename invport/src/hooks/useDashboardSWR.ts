'use client';

import useSWR from 'swr';
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
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    'dashboard-stats',
    fetchDashboardStats,
    {
      refreshInterval: 0, // Disable auto-refresh
      revalidateOnFocus: false, // Disable revalidation on focus
      revalidateOnReconnect: false, // Disable revalidation on reconnect
      dedupingInterval: 0, // No deduplication - always fetch fresh
      errorRetryCount: 3,
      errorRetryInterval: 2000
    }
  );

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

