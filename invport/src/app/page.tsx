'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { 
  DashboardStats, 
  QuickActions, 
  SystemStatus,
  ErrorBoundary,
  ErrorFallback
} from '@/components/ui';
import { useDashboardSWR } from '@/hooks/useDashboardSWR';

export default function Dashboard() {
  const router = useRouter();
  const { stats, systemStatus, isLoading, error, refreshData } = useDashboardSWR();

  const handleStatClick = (statType: string) => {
    // Navigate to relevant page based on stat clicked
    switch (statType) {
      case 'total-inventory':
        router.push('/inventory');
        break;
      case 'total-value':
        router.push('/reports');
        break;
      case 'available-units':
        router.push('/inventory?filter=available');
        
        break;
      default:
        break;
    }
  };

  return (
      <ErrorBoundary>
        <div className="space-y-4">
          {/* Dashboard Header with Refresh Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Welcome to your inventory management system</p>
            </div>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh all dashboard data"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Show error message if data fetch failed */}
          {error && (
            <ErrorFallback 
              error={error} 
              onRetry={refreshData}
              title="Failed to load dashboard data"
            />
          )}

          {/* Dashboard Stats - More compact */}
          <ErrorBoundary>
            <DashboardStats 
              stats={stats}
              isLoading={isLoading}
              onStatClick={handleStatClick}
            />
          </ErrorBoundary>

          {/* Main Content Grid - Improved responsive layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left Column - Quick Actions */}
            <div className="lg:col-span-3 space-y-4">
              <ErrorBoundary>
                <QuickActions />
              </ErrorBoundary>
            </div>

            {/* System Status - Smaller on desktop */}
            <div className="lg:col-span-1">
              <ErrorBoundary>
                <SystemStatus
                  status={systemStatus.database}
                  message={systemStatus.message}
                  lastChecked={systemStatus.lastChecked}
                  onRefresh={refreshData}
                  isRefreshing={isLoading}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </ErrorBoundary>
  );
}

