'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CubeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ListBulletIcon
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
  subItems?: NavigationItem[];
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
    subItems: [
      {
        name: 'Current Inventory',
        href: '/inventory',
        icon: ListBulletIcon,
      },
      {
        name: 'Add Item',
        href: '/inventory/add',
        icon: PlusCircleIcon,
      }
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Auto-expand Inventory when on any inventory page
  React.useEffect(() => {
    if (pathname.startsWith('/inventory') && !expandedItems.includes('Inventory')) {
      setExpandedItems(prev => [...prev, 'Inventory']);
    }
  }, [pathname, expandedItems]);

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
        lg:translate-x-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]
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
              // Check if this is a parent item with sub-items
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.name);
              
              // More precise active state logic
              let isActive = false;
              let isSubItemActive = false;
              
              if (hasSubItems) {
                // For items with sub-items, check if we're on any sub-item page
                const subItemPaths = item.subItems?.map(sub => sub.href) || [];
                isSubItemActive = subItemPaths.some(path => pathname === path);
                
                // Highlight parent if we're on a related sub-route (like edit pages)
                if (!isSubItemActive && pathname.startsWith(item.href + '/')) {
                  isActive = true;
                }
              } else {
                // For simple items, exact match or startsWith for nested routes
                if (item.href === '/') {
                  isActive = pathname === '/';
                } else {
                  isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                }
              }
              
              return (
                <li key={item.name}>
                  {/* Main Navigation Item */}
                  <div className="relative">
                    <Link
                      href={item.href}
                      className={`
                        group relative flex items-center transition-all duration-300 cursor-pointer
                        ${isCollapsed ? 'justify-center px-3 py-3 mx-2' : 'gap-3 px-4 py-3 mx-3'}
                        rounded-md
                        ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                            : isSubItemActive
                            ? 'bg-white/5 text-blue-100'
                            : 'text-blue-100 hover:bg-white/10 hover:text-white'
                        }
                      `}
                      onClick={(e) => {
                        if (hasSubItems && !isCollapsed) {
                          e.preventDefault();
                          toggleExpand(item.name);
                        } else {
                          onClose();
                        }
                      }}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className={`flex-shrink-0 transition-colors ${
                        isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                      }`} />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-sm tracking-wide flex-1">{item.name}</span>
                          {hasSubItems && (
                            <ChevronDownIcon 
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </>
                      )}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>
                      )}
                    </Link>

                    {/* Animated white indicator bar */}
                    {(isActive || isSubItemActive) && !isCollapsed && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-lg shadow-white/50"></div>
                    )}
                  </div>

                  {/* Sub Items - Animated Dropdown */}
                  {hasSubItems && !isCollapsed && (
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="mt-1 space-y-1 ml-3">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          
                          return (
                            <li key={subItem.name} className="relative">
                              <Link
                                href={subItem.href}
                                className={`
                                  group relative flex items-center gap-3 px-4 py-2.5 mx-3 rounded-lg
                                  transition-all duration-200 cursor-pointer border-2
                                  ${
                                    isSubActive
                                      ? 'bg-white text-blue-700 shadow-xl border-white font-bold scale-105'
                                      : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1 border-transparent'
                                  }
                                `}
                                onClick={onClose}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSubActive ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-blue-300'}`}></div>
                                <subItem.icon className={`w-5 h-5 flex-shrink-0 ${isSubActive ? 'text-blue-600' : ''}`} />
                                <span className={`text-sm tracking-wide ${isSubActive ? 'text-blue-900' : ''}`}>{subItem.name}</span>
                                {isSubActive && (
                                  <div className="ml-auto">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                  </div>
                                )}
                              </Link>

                              {/* Animated white indicator for sub-item */}
                              {isSubActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full shadow-lg shadow-blue-500/50 animate-slideIn"></div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
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

