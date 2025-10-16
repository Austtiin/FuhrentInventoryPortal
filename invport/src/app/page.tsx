'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { DashboardStats, QuickActions, SystemStatus } from '@/components/ui';
import { useDashboardSWR } from '@/hooks/useDashboardSWR';

export default function Dashboard() {
  const router = useRouter();
  const { stats, systemStatus, isLoading, refreshData } = useDashboardSWR();

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
      <div className="space-y-4">
        {/* Dashboard Stats - More compact */}
        <DashboardStats 
          stats={stats}
          isLoading={isLoading}
          onStatClick={handleStatClick}
        />

        {/* Main Content Grid - Improved responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Quick Actions - Takes more space on desktop */}
          <div className="lg:col-span-3">
            <QuickActions />
          </div>

          {/* System Status - Smaller on desktop */}
          <div className="lg:col-span-1">
            <SystemStatus
              status={systemStatus.database}
              message={systemStatus.message}
              lastChecked={systemStatus.lastChecked}
              onRefresh={refreshData}
              isRefreshing={isLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

