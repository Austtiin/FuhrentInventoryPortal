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
        bg-white rounded-lg shadow-sm border border-gray-200/50 p-4 sm:p-6 
        hover:shadow-lg transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconColor} rounded-md flex items-center justify-center`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        {isLoading && (
          <div className="animate-spin">
            <ArrowPathIcon className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
          {isLoading ? '...' : value}
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm font-medium">{title}</p>
      </div>
    </div>
  );
};