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
        bg-white rounded border border-gray-200 p-4 sm:p-5
        transition-colors
        ${onClick ? 'cursor-pointer hover:border-slate-400 hover:bg-gray-50' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}: ${value}` : undefined}
      onKeyDown={event => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconColor} rounded flex items-center justify-center`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
        </div>
        {isLoading && (
          <div className="animate-spin">
            <ArrowPathIcon className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </div>
      <div>
        {isLoading ? (
          <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mb-0.5"></div>
        ) : (
          <h3 className="text-2xl font-semibold tabular-nums text-slate-900 mb-1">
            {value}
          </h3>
        )}
        {isLoading ? (
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        ) : (
          <p className="text-slate-600 text-sm">
            {title}
          </p>
        )}
      </div>
    </div>
  );
};
