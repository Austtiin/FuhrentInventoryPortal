'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DashboardStats {
  totalInventory: number;
  totalValue: string;
  availableUnits: number;
}

export interface SystemStatus {
  database: 'online' | 'offline' | 'error';
  message?: string;
}

interface DashboardResponse {
  totalInventory: number;
  totalValue: string;
  availableUnits: number;
  systemStatus: SystemStatus;
  error?: string;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'offline'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DashboardResponse = await response.json();

      if (data.error) {
        setError(data.error);
      }

      setStats({
        totalInventory: data.totalInventory,
        totalValue: data.totalValue,
        availableUnits: data.availableUnits
      });

      setSystemStatus(data.systemStatus);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setSystemStatus({
        database: 'error',
        message: err instanceof Error ? err.message : 'Unknown error'
      });
      
      // Use fallback data on error
      setStats({
        totalInventory: 0,
        totalValue: '$0',
        availableUnits: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  return {
    stats,
    systemStatus,
    isLoading,
    error,
    refreshData
  };
}

