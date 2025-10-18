'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';

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

      console.log('🔄 Loading dashboard data from API...');

      // Call the API endpoint for dashboard stats
      const response = await apiFetch('/GetDashboardStats');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Format total value as currency
        const totalValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(result.data.totalValue);

        // Set stats from API response
        setStats({
          totalInventory: result.data.totalInventory,
          totalValue,
          availableUnits: result.data.availableUnits
        });

        // Update system status based on database connection
        const dbStatus = result.data.databaseStatus;
        let systemStatus: SystemStatus;
        
        if (dbStatus.status === 'Connected') {
          systemStatus = {
            database: 'online',
            message: dbStatus.message,
            lastChecked: new Date(dbStatus.lastChecked)
          };
        } else if (dbStatus.status === 'Error') {
          systemStatus = {
            database: 'error',
            message: dbStatus.message,
            lastChecked: new Date(dbStatus.lastChecked)
          };
        } else {
          systemStatus = {
            database: 'offline',
            message: dbStatus.message,
            lastChecked: new Date(dbStatus.lastChecked)
          };
        }

        setSystemStatus(systemStatus);
        console.log('✅ Dashboard data loaded successfully from API');

        // Log any individual errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([key, error]) => {
            if (error) {
              console.warn(`⚠️ ${key} error:`, error);
            }
          });
        }

      } else {
        throw new Error(result.error || 'API returned unsuccessful response');
      }

    } catch (err) {
      console.error('❌ Failed to load dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      setSystemStatus({
        database: 'error',
        message: errorMessage,
        lastChecked: new Date()
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

