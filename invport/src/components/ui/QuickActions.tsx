'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  CubeIcon, 
  ArrowTrendingUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  primary?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'add-vehicle',
    label: 'Add New Vehicle',
    icon: PlusIcon,
    route: '/inventory/add',
    primary: true
  },
  {
    id: 'search-inventory',
    label: 'Search Inventory',
    icon: MagnifyingGlassIcon,
    route: '/inventory' // Fixed: Changed from /inventory/search to /inventory
  },
  {
    id: 'view-inventory',
    label: 'View All Inventory',
    icon: CubeIcon,
    route: '/inventory'
  },
  {
    id: 'export-data',
    label: 'Export Data',
    icon: DocumentArrowDownIcon,
    route: '/reports' // Fixed: Changed from /reports/export to /reports
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    icon: ArrowTrendingUpIcon,
    route: '/reports' // Already correct
  }
];

export const QuickActions: React.FC = () => {
  const router = useRouter();
  
  const primaryAction = quickActions.find(action => action.primary);
  const secondaryActions = quickActions.filter(action => !action.primary);
  
  const handleActionClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
      
      {/* Mobile: Stack layout with expandable secondary actions */}
      <div className="block lg:hidden space-y-3">
        {/* Primary Action - Always visible */}
        {primaryAction && (
          <button
            onClick={() => handleActionClick(primaryAction.route)}
            className="w-full flex items-center justify-center gap-3 p-4 bg-[#1C4840] text-white rounded-lg hover:bg-teal-700 transition-all duration-200 cursor-pointer"
          >
            <primaryAction.icon className="w-5 h-5" />
            <span className="font-medium">{primaryAction.label}</span>
          </button>
        )}
        
        {/* Quick Access Actions - All visible on mobile now */}
        <div className="grid grid-cols-2 gap-2">
          {secondaryActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.route)}
              className="flex items-center gap-2 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-[#1C4840] hover:text-white transition-colors cursor-pointer"
            >
              <action.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Desktop: Grid layout */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.route)}
            className={`
              flex items-center gap-2 p-3 rounded-lg transition-all duration-200 cursor-pointer text-sm
              ${action.primary 
                ? 'bg-[#1C4840] text-white hover:bg-teal-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-[#1C4840] hover:text-white'
              }
            `}
          >
            <action.icon className="w-4 h-4" />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};