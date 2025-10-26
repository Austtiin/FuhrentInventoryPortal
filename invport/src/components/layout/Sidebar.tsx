'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CubeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Auto-expand parent items when on any of their sub-pages
  React.useEffect(() => {
    // Auto-expand Inventory when on any inventory page
    if (pathname.startsWith('/inventory')) {
      setExpandedItems(prev => {
        if (!prev.includes('Inventory')) {
          return [...prev, 'Inventory'];
        }
        return prev;
      });
    }
    
    // Auto-expand Reports when on any reports page
    if (pathname.startsWith('/reports')) {
      setExpandedItems(prev => {
        if (!prev.includes('Reports')) {
          return [...prev, 'Reports'];
        }
        return prev;
      });
    }
  }, [pathname]); // Only depend on pathname, not expandedItems

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-200/70 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-20 left-0 h-[calc(100vh-5rem)] bg-linear-to-b from-slate-900 to-blue-900 border-r border-blue-800/30
        transform transition-all duration-300 z-40 flex flex-col shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]
        lg:w-64 w-64
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-800/30 bg-linear-to-r from-blue-900 to-indigo-900 relative">
          <h2 className="text-lg font-bold text-white tracking-tight">Inventory Portal</h2>
          <div className="flex items-center gap-2" />
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
                // For items with sub-items, check if we're on any sub-item page exactly
                const subItemPaths = item.subItems?.map(sub => sub.href) || [];
                isSubItemActive = subItemPaths.some(path => pathname === path);
                
                // Parent should ONLY be highlighted if on edit pages or other non-menu sub-routes
                // NOT highlighted when on actual sub-item pages (Current Inventory, Add Item)
                if (!isSubItemActive && pathname.startsWith(item.href + '/') && pathname !== item.href) {
                  // On /inventory/edit/123 or similar non-menu pages
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
                        gap-3 px-4 py-3 mx-3
                        rounded-md
                        ${
                          isActive 
                            ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                            : isSubItemActive
                            ? 'bg-white/5 text-blue-100'
                            : 'text-blue-100 hover:bg-white/10 hover:text-white'
                        }
                      `}
                      onClick={(e) => {
                        if (hasSubItems) {
                          e.preventDefault();
                          toggleExpand(item.name);
                        } else {
                          onClose();
                        }
                      }}
                      title={undefined}
                    >
                      <item.icon className={`shrink-0 transition-colors w-5 h-5`} />
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
                    </Link>

                    {/* Animated white indicator bar */}
                    {(isActive || isSubItemActive) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-lg shadow-white/50"></div>
                    )}
                  </div>

                  {/* Sub Items - Animated Dropdown */}
                  {hasSubItems && (
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="space-y-2 ml-2">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          
                          return (
                            <li key={subItem.name} className="relative">
                              <Link
                                href={subItem.href}
                                className={`
                                  group relative flex items-center gap-3 px-4 py-3 mx-3 rounded-lg
                                  transition-all duration-200 cursor-pointer
                                  ${
                                    isSubActive
                                      ? 'bg-linear-to-r from-white to-blue-50 text-blue-900 shadow-2xl font-bold scale-105 border-2 border-blue-500'
                                      : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1 border-2 border-transparent'
                                  }
                                `}
                                onClick={onClose}
                              >
                                {/* Active indicator dot */}
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                                  isSubActive 
                                    ? 'bg-blue-600 ring-4 ring-blue-300 shadow-lg shadow-blue-500/50' 
                                    : 'bg-blue-400/50'
                                }`}></div>
                                
                                {/* Icon */}
                                <subItem.icon className={`w-5 h-5 shrink-0 transition-all ${
                                  isSubActive ? 'text-blue-700 scale-110' : 'text-blue-300'
                                }`} />
                                
                                {/* Label */}
                                <span className={`text-sm tracking-wide flex-1 ${
                                  isSubActive ? 'text-blue-900 font-bold' : 'font-medium'
                                }`}>
                                  {subItem.name}
                                </span>
                                
                                {/* Active pulse indicator */}
                                {isSubActive && (
                                  <div className="ml-auto flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                  </div>
                                )}
                              </Link>

                              {/* Animated vertical indicator bar for active sub-item */}
                              {isSubActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-linear-to-r from-blue-600 to-blue-500 rounded-r-full shadow-lg shadow-blue-600/50"></div>
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
        <div className={`border-t border-blue-800/30 bg-slate-800/50 p-4`}>
          <div className={`flex items-center gap-3`}>
            <div className={`bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-md flex items-center justify-center font-bold cursor-pointer hover:shadow-lg transition-all w-12 h-12 text-base`}>
              FE
            </div>
            {
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white m-0 truncate">
                  Dealer Portal
                </p>
                <p className="text-xs text-blue-200 m-0 truncate">
                  Inventory System
                </p>
              </div>
            }
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

