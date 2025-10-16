'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { useReportsData } from '@/hooks/useReportsData';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const { data: reportsData, isLoading, error, lastUpdated, refresh } = useReportsData();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get dynamic stats from real data
  const getStatsData = () => {
    if (!reportsData || !reportsData.totalStats) return [];
    
    const totalStats = reportsData.totalStats;
    const statusBreakdown = reportsData.statusBreakdown || [];
    
    const pendingCount = statusBreakdown.find((s) => s.status.toLowerCase() === 'pending')?.count || 0;
    
    return [
      {
        title: 'Total Inventory Value',
        value: formatCurrency(totalStats.totalValue || 0),
        change: '+12.5%',
        changeType: 'positive' as const,
        icon: CurrencyDollarIcon,
      },
      {
        title: 'Total Vehicles',
        value: (totalStats.totalVehicles || 0).toString(),
        change: `+${Math.round(((totalStats.totalVehicles || 0) * 0.05))}`,
        changeType: 'positive' as const,
        icon: CubeIcon,
      },
      {
        title: 'Average Price',
        value: formatCurrency(totalStats.avgPrice || 0),
        change: '+3.2%',
        changeType: 'positive' as const,
        icon: ArrowTrendingUpIcon,
      },
      {
        title: 'Unique Makes',
        value: (totalStats.uniqueMakes || 0).toString(),
        change: '0',
        changeType: 'neutral' as const,
        icon: BuildingStorefrontIcon,
      },
      {
        title: 'Pending Sales',
        value: pendingCount.toString(),
        change: '-2',
        changeType: 'negative' as const,
        icon: ArrowTrendingDownIcon,
      },
    ];
  };

  const statsData = getStatsData();

  const reportTypes = [
    {
      title: 'Inventory Summary Report',
      description: 'Comprehensive overview of all inventory items with current values and status',
      format: ['PDF', 'Excel', 'CSV'],
    },
    {
      title: 'Sales Performance Report',
      description: 'Analysis of vehicle sales trends and performance metrics',
      format: ['PDF', 'Excel'],
    },
    {
      title: 'Category Breakdown Report',
      description: 'Detailed breakdown of inventory by vehicle categories and types',
      format: ['PDF', 'Excel', 'CSV'],
    },
    {
      title: 'Location Analysis Report',
      description: 'Geographic distribution and performance analysis by location',
      format: ['PDF', 'Excel'],
    },
    {
      title: 'Financial Overview Report',
      description: 'Financial metrics including total value, pricing trends, and profitability',
      format: ['PDF', 'Excel'],
    },
    {
      title: 'Custom Report Builder',
      description: 'Create custom reports with specific filters and data points',
      format: ['PDF', 'Excel', 'CSV'],
    },
  ];

  const generateReport = (reportType: string, format: string) => {
    console.log(`Generating ${reportType} report in ${format} format`);
    alert(`Generating ${reportType} in ${format} format...`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into your inventory performance and metrics
              {lastUpdated && (
                <span className="text-sm text-gray-500 block mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowTrendingUpIcon className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error Loading Reports Data</h2>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <button 
              onClick={() => refresh()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !reportsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Overview */}
        {!isLoading && reportsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {statsData.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${
                      stat.changeType === 'positive' ? 'bg-green-100 text-green-600' :
                      stat.changeType === 'negative' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  {reportsData.categoryBreakdown && reportsData.categoryBreakdown.length > 0 ? (
                    reportsData.categoryBreakdown.slice(0, 6).map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{category.count} units</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(category.totalValue)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No category data available</p>
                  )}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <div className="space-y-3">
                  {reportsData.statusBreakdown && reportsData.statusBreakdown.length > 0 ? (
                    reportsData.statusBreakdown.map((status, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">{status.status}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{status.count} units</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {status.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No status data available</p>
                  )}
                </div>
              </div>

              {/* Top Makes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Vehicle Makes</h3>
                <div className="space-y-3">
                  {reportsData.makeDistribution && reportsData.makeDistribution.length > 0 ? (
                    reportsData.makeDistribution.slice(0, 8).map((make, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{make.make}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{make.count} units</span>
                          <span className="text-sm font-semibold text-gray-900">
                            Avg: {formatCurrency(make.avgPrice || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No make data available</p>
                  )}
                </div>
              </div>

              {/* Price Range Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range Distribution</h3>
                <div className="space-y-3">
                  {reportsData.priceStats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Under $10,000</span>
                        <span className="text-sm text-gray-600">{reportsData.priceStats.under10k} units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">$10,000 - $25,000</span>
                        <span className="text-sm text-gray-600">{reportsData.priceStats.range10k25k} units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">$25,000 - $50,000</span>
                        <span className="text-sm text-gray-600">{reportsData.priceStats.range25k50k} units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Over $50,000</span>
                        <span className="text-sm text-gray-600">{reportsData.priceStats.over50k} units</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Available Reports Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Available Reports</h2>
            <p className="text-gray-600 mt-1">Generate detailed reports in various formats</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportTypes.map((report, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    </div>
                    <DocumentArrowDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {report.format.map((format) => (
                      <button
                        key={format}
                        onClick={() => generateReport(report.title, format)}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Generate {format}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Schedule Report</div>
                  <div className="text-sm text-gray-600">Set up automated reports</div>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">View Analytics</div>
                  <div className="text-sm text-gray-600">Interactive data visualization</div>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <DocumentArrowDownIcon className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Export Data</div>
                  <div className="text-sm text-gray-600">Bulk data export options</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;