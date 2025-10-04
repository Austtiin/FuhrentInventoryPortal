'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CubeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  CogIcon,
  UsersIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon
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
  {
    name: 'Users',
    href: '/users',
    icon: UsersIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200/70
        transform transition-all duration-300 z-30 flex flex-col shadow-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:top-0 lg:h-[calc(100vh-4rem)]
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        w-64
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/70 bg-gradient-to-r from-primary-mint to-primary-mint-dark">
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-white tracking-tight">Admin Panel</h2>
          )}
          <div className="flex items-center gap-2">
            <button 
              className="hidden lg:flex items-center justify-center w-8 h-8 bg-white/20 hover:bg-white/30 border-none rounded-lg cursor-pointer transition-colors backdrop-blur-sm"
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
              className="flex lg:hidden items-center justify-center w-8 h-8 bg-white/20 hover:bg-white/30 border-none rounded-lg cursor-pointer transition-colors backdrop-blur-sm"
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
                      group relative flex items-center transition-all duration-200
                      ${isCollapsed ? 'justify-center px-3 py-3 mx-2' : 'gap-3 px-4 py-3 mx-3'}
                      rounded-xl
                      ${
                        isActive 
                          ? 'bg-primary-mint text-white shadow-lg shadow-primary-mint/30' 
                          : 'text-gray-700 hover:bg-slate-100 hover:text-primary-mint'
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
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className={`border-t border-gray-200/70 bg-gray-50/50 ${
          isCollapsed ? 'p-3' : 'p-4'
        }`}>
          <div className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-3'
          }`}>
            <div className={`bg-gradient-to-br from-primary-mint to-primary-mint-dark text-white rounded-full flex items-center justify-center font-bold cursor-pointer hover:shadow-lg transition-all ${
              isCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'
            }`}>
              AU
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 m-0 truncate">
                  Admin User
                </p>
                <p className="text-xs text-slate-500 m-0 truncate">
                  Administrator
                </p>
              </div>
            )}
          </div>
          
          {/* Sign Out Button */}
          <div className="mt-3">
            <button 
              onClick={() => {
                // TODO: Implement OAuth sign out
                console.log('Sign out clicked');
              }}
              className={`
                group flex items-center transition-all duration-200 w-full
                ${isCollapsed ? 'justify-center px-3 py-2' : 'gap-3 px-3 py-2'}
                rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700
              `}
              title={isCollapsed ? 'Sign Out' : undefined}
            >
              <ArrowRightOnRectangleIcon className={`flex-shrink-0 transition-colors ${
                isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
              }`} />
              {!isCollapsed && (
                <span className="font-medium text-sm">Sign Out</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                  Sign Out
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;