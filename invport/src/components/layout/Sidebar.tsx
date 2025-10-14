'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CubeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: CubeIcon,
  },
  {
    name: 'Add Item',
    href: '/inventory/add',
    icon: PlusCircleIcon,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-20 left-0 h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-900 to-blue-900 border-r border-blue-800/30
        transform transition-all duration-300 z-40 flex flex-col shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:top-0 lg:h-[calc(100vh-5rem)]
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        w-64
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-800/30 bg-gradient-to-r from-blue-900 to-indigo-900">
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-white tracking-tight">Inventory Portal</h2>
          )}
          <div className="flex items-center gap-2">
            <button 
              className="hidden lg:flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 border-none rounded-md cursor-pointer transition-colors backdrop-blur-sm"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4 text-white" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4 text-white" />
              )}
            </button>
            <button 
              className="flex lg:hidden items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 border-none rounded-md cursor-pointer transition-colors backdrop-blur-sm"
              onClick={onClose}
              aria-label="Close menu"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          <ul className="list-none m-0 p-0 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      group relative flex items-center transition-all duration-200 cursor-pointer
                      ${isCollapsed ? 'justify-center px-3 py-3 mx-2' : 'gap-3 px-4 py-3 mx-3'}
                      rounded-md
                      ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    onClick={onClose}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`flex-shrink-0 transition-colors ${
                      isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                    }`} />
                    {!isCollapsed && (
                      <span className="font-medium text-sm tracking-wide">{item.name}</span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className={`border-t border-blue-800/30 bg-slate-800/50 ${
          isCollapsed ? 'p-3' : 'p-4'
        }`}>
          <div className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-3'
          }`}>
            <div className={`bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-md flex items-center justify-center font-bold cursor-pointer hover:shadow-lg transition-all ${
              isCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'
            }`}>
              FE
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white m-0 truncate">
                  Dealer Portal
                </p>
                <p className="text-xs text-blue-200 m-0 truncate">
                  Inventory System
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

