'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  // Mock data for demonstration
  const statsData = [
    {
      title: 'Total Inventory Value',
      value: '$2,847,500',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: CurrencyDollarIcon,
    },
    {
      title: 'Total Vehicles',
      value: '156',
      change: '+8',
      changeType: 'positive' as const,
      icon: CubeIcon,
    },
    {
      title: 'Average Price',
      value: '$18,253',
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: ArrowTrendingUpIcon,
    },
    {
      title: 'Categories',
      value: '6',
      change: '0',
      changeType: 'neutral' as const,
      icon: ChartBarIcon,
    },
    {
      title: 'Pending Sales',
      value: '23',
      change: '-2',
      changeType: 'negative' as const,
      icon: ArrowTrendingDownIcon,
    },
  ];

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
    // TODO: Implement report generation logic
    console.log(`Generating ${reportType} report in ${format} format`);
  };

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-black">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate detailed reports and analyze your inventory data</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
            Date Range:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-mint focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-primary-black mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-primary-mint' :
                    stat.changeType === 'negative' ? 'text-red-600' :
                    stat.changeType === 'neutral' ? 'text-gray-500' :
                    'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs previous period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary-mint bg-opacity-10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary-mint" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Available Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-primary-black">Available Reports</h2>
          <p className="text-gray-600 mt-1">Generate detailed reports in various formats</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportTypes.map((report, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-black mb-2">{report.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  </div>
                  <DocumentArrowDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {report.format.map((format) => (
                    <button
                      key={format}
                      onClick={() => generateReport(report.title, format)}
                      className="px-3 py-1 text-xs font-medium bg-primary-mint text-white rounded-md hover:bg-primary-mint-dark transition-colors"
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
          <h2 className="text-xl font-bold text-primary-black">Quick Actions</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-primary-mint hover:bg-primary-mint hover:bg-opacity-5 transition-all cursor-pointer">
              <CalendarIcon className="w-5 h-5 text-primary-mint" />
              <div className="text-left">
                <div className="font-medium text-primary-black">Schedule Report</div>
                <div className="text-sm text-gray-600">Set up automated reports</div>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-primary-mint hover:bg-primary-mint hover:bg-opacity-5 transition-all cursor-pointer">
              <ChartBarIcon className="w-5 h-5 text-primary-mint" />
              <div className="text-left">
                <div className="font-medium text-primary-black">View Analytics</div>
                <div className="text-sm text-gray-600">Interactive data visualization</div>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-primary-mint hover:bg-primary-mint hover:bg-opacity-5 transition-all cursor-pointer">
              <DocumentArrowDownIcon className="w-5 h-5 text-primary-mint" />
              <div className="text-left">
                <div className="font-medium text-primary-black">Export Data</div>
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