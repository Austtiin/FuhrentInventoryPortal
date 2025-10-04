'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { 
  CubeIcon, 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const router = useRouter();

  // Mock dashboard data
  const stats = [
    {
      title: 'Total Inventory',
      value: '156',
      change: '+12',
      changeType: 'positive' as const,
      icon: CubeIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Value',
      value: '$2.8M',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: CurrencyDollarIcon,
      color: 'bg-primary-mint',
    },
    {
      title: 'Available Units',
      value: '142',
      change: '-4',
      changeType: 'negative' as const,
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Low Stock Alerts',
      value: '8',
      change: '+3',
      changeType: 'warning' as const,
      icon: ExclamationTriangleIcon,
      color: 'bg-orange-500',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'New vehicle added',
      item: '2024 Honda Civic',
      time: '2 hours ago',
      type: 'add',
    },
    {
      id: 2,
      action: 'Vehicle sold',
      item: '2023 Ford Mustang',
      time: '4 hours ago',
      type: 'sold',
    },
    {
      id: 3,
      action: 'Price updated',
      item: '2022 Toyota Camry',
      time: '6 hours ago',
      type: 'update',
    },
    {
      id: 4,
      action: 'Vehicle reserved',
      item: '2024 BMW X5',
      time: '8 hours ago',
      type: 'reserved',
    },
  ];

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'add': return '✅';
      case 'sold': return '💰';
      case 'update': return '📝';
      case 'reserved': return '🔒';
      default: return '📋';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-mint to-primary-mint-dark rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h1>
          <p className="text-primary-mint-light text-lg">
            Monitor your inventory performance and manage your inventory efficiently.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-sm font-semibold ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-200/50">
                <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                <p className="text-slate-600 mt-1">Latest updates from your inventory</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{activity.action}</p>
                        <p className="text-slate-600 text-sm">{activity.item}</p>
                      </div>
                      <div className="text-sm text-slate-500">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/inventory/add')}
                  className="w-full flex items-center gap-3 p-4 bg-primary-mint text-white rounded-xl hover:bg-primary-mint-dark transition-colors cursor-pointer"
                >
                  <CubeIcon className="w-5 h-5" />
                  <span className="font-medium">Add New Vehicle</span>
                </button>
                <button 
                  onClick={() => router.push('/inventory')}
                  className="w-full flex items-center gap-3 p-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  <span className="font-medium">View Inventory</span>
                </button>
                <button 
                  onClick={() => router.push('/reports')}
                  className="w-full flex items-center gap-3 p-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                  <span className="font-medium">Generate Report</span>
                </button>
                <button 
                  onClick={() => router.push('/users')}
                  className="w-full flex items-center gap-3 p-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <UsersIcon className="w-5 h-5" />
                  <span className="font-medium">Manage Users</span>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Database</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Backup</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Current</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">API Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}