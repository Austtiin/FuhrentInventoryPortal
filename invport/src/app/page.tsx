'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { DashboardStats, QuickActions, SystemStatus } from '@/components/ui';
import { useDashboard } from '@/hooks/useDashboard';

export default function Dashboard() {
  const router = useRouter();
  const { stats, systemStatus, isLoading, refreshData } = useDashboard();

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
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Dashboard Stats */}
        <DashboardStats 
          stats={stats}
          isLoading={isLoading}
          onStatClick={handleStatClick}
        />

        {/* Main Content Grid - Mobile First Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Quick Actions - Takes full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2">
            <QuickActions />
          </div>

          {/* System Status - Full width on mobile, 1/3 on desktop */}
          <div className="space-y-4 sm:space-y-6">
            <SystemStatus
              status={systemStatus.database}
              message={systemStatus.message}
              onRefresh={refreshData}
              isRefreshing={isLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

