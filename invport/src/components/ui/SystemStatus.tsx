'use client';

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface SystemStatusProps {
  status: 'online' | 'offline' | 'error';
  message?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  status,
  message,
  onRefresh,
  isRefreshing = false
}) => {
  const getStatusColor = (status: 'online' | 'offline' | 'error') => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: 'online' | 'offline' | 'error') => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">System Status</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh status"
          >
            <ArrowPathIcon className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 text-sm sm:text-base">Database Connection</span>
          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        </div>
        
        {message && (
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md border-l-2 border-slate-200">
            <p className="font-medium text-slate-600 mb-1">Details:</p>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};