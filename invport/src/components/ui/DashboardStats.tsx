'use client';

import React from 'react';
import { StatCard } from './StatCard';
import { 
  CubeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface DashboardStatsData {
  totalInventory: number;
  totalValue: string;
  availableUnits: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsData | null;
  isLoading: boolean;
  onStatClick?: (statType: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  isLoading,
  onStatClick
}) => {
  const statsConfig = [
    {
      id: 'total-inventory',
      title: 'Total Items',
      value: isLoading ? '-' : (stats?.totalInventory?.toString() || '-'),
      icon: CubeIcon,
      iconColor: 'bg-blue-500',
      route: '/inventory'
    },
    {
      id: 'total-value',
      title: 'Total Value',
      value: isLoading ? '-' : (stats?.totalValue || '-'),
      icon: CurrencyDollarIcon,
      iconColor: 'bg-green-500',
      route: '/reports'
    },
    {
      id: 'available-units',
      title: 'Available Items',
      value: isLoading ? '-' : (stats?.availableUnits?.toString() || '-'),
      icon: ChartBarIcon,
      iconColor: 'bg-indigo-500',
      route: '/inventory?filter=available'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.iconColor}
          isLoading={isLoading}
          onClick={onStatClick ? () => onStatClick(stat.id) : undefined}
        />
      ))}
    </div>
  );
};