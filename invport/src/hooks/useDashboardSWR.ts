'use client';

import { useSWR } from './useSWR';

export interface DashboardStats {
  totalInventory: number;
  totalValue: string;
  availableUnits: number;
}

export interface SystemStatus {
  database: 'online' | 'offline' | 'error';
  message?: string;
  lastChecked?: Date;
}

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

// Fetcher function for dashboard data
const fetchDashboardStats = async (): Promise<DashboardData> => {
  const response = await fetch('/api/dashboard/stats');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch dashboard stats');
  }

  return data;
};

// Custom hook for dashboard data with SWR caching
export function useDashboardSWR() {
  const { data, error, isLoading, isValidating, mutate, refresh } = useSWR(
    'dashboard-stats',
    fetchDashboardStats,
    {
      refreshInterval: 60000, // Refresh every 60 seconds for dashboard
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds deduplication
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
    refreshData: refresh
  };
}