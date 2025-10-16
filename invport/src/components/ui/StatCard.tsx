'use client';

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  isLoading = false,
  onClick
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200/50 p-3 sm:p-4 
        hover:shadow-md transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/30' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        {isLoading && (
          <div className="animate-spin">
            <ArrowPathIcon className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5">
          {isLoading ? (
            <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
          ) : (
            value
          )}
        </h3>
        <p className="text-slate-600 text-xs font-medium">
          {isLoading ? (
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          ) : (
            title
          )}
        </p>
      </div>
    </div>
  );
};