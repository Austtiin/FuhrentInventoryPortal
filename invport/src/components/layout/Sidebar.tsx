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
  ListBulletIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  isExpanded: boolean;
  onToggleWidth: () => void;
  isDesktop: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavigationItem[];
  exact?: boolean; // when true, match only exact href (no nested)
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, width, isExpanded, onToggleWidth, isDesktop }) => {
  const pathname = usePathname();
    // Normalize the pathname by removing trailing slashes for consistent matching
    const cleanPath = React.useMemo(() => {
      if (!pathname) return '/';
      const p = pathname.replace(/\/+$/g, '');
      return p.length ? p : '/';
    }, [pathname]);
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
    if (cleanPath.startsWith('/inventory')) {
      setExpandedItems(prev => {
        if (!prev.includes('Inventory')) {
          return [...prev, 'Inventory'];
        }
        return prev;
      });
    }
    
    // Auto-expand Reports when on any reports page
    if (cleanPath.startsWith('/reports')) {
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
          className="absolute inset-0 bg-slate-200/70 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`
          sticky top-2 left-0 self-start bg-[#ECF5E9]
          transform transition-transform duration-300 z-40 flex flex-col shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 rounded-2xl
          max-h-[calc(100vh-1rem)] overflow-y-auto
          w-64
        `}
        style={{ width: isDesktop ? `${width}px` : '256px', marginLeft: isDesktop ? '0' : undefined }}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-center pt-2 pb-1 px-3 bg-[#ECF5E9] relative">
          <div className="flex items-center justify-center w-full">
            <img
              src="/logo/FELogo.png"
              alt="Fuhr Enterprise logo"
              className={`hover:opacity-90 transition-all duration-300 object-contain ${
                isExpanded ? 'h-20 w-full' : 'h-8 w-auto'
              }`}
            />
          </div>
        </div>
        
        {/* Gradient Separator */}
        <div className="h-px bg-linear-to-r from-transparent via-[#1C4840] to-transparent opacity-30 mx-4"></div>
        
        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-hidden">
          <ul className="list-none m-0 p-0 space-y-1">
            {navigationItems.map((item) => {
              // Check if this is a parent item with sub-items
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isMenuExpanded = expandedItems.includes(item.name);
              
              // More precise active state logic
              let isActive = false;
              let isSubItemActive = false;
              
              if (hasSubItems) {
                // For items with sub-items, check if we're on any sub-item page or nested path
                const subItemPaths = (item.subItems?.map(sub => sub.href) || []).map(h => h.replace(/\/+$/g, ''));
                isSubItemActive = subItemPaths.some(path => (
                  cleanPath === path || cleanPath.startsWith(path + '/')
                ));

                // Parent should ONLY be highlighted if on non-menu nested routes
                // NOT highlighted when on actual sub-item pages (Current Inventory, Add Item)
                const parentHref = item.href.replace(/\/+$/g, '');
                if (!isSubItemActive && (cleanPath.startsWith(parentHref + '/') && cleanPath !== parentHref)) {
                  // On /inventory/edit/123 or similar non-menu pages
                  isActive = true;
                }
              } else {
                // For simple items, exact match or startsWith for nested routes
                if (item.href === '/') {
                  isActive = pathname === '/';
                } else {
                  const itemHref = item.href.replace(/\/+$/g, '');
                  isActive = cleanPath === itemHref || cleanPath.startsWith(itemHref + '/');
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
                        rounded-md
                        ${
                          isExpanded 
                            ? 'gap-3 px-4 py-3 mx-3'
                            : 'justify-center p-3 mx-2'
                        }
                        ${
                          isActive 
                            ? 'bg-[#1C4840] text-white' 
                            : isSubItemActive
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-[#1C4840] hover:text-white'
                        }
                      `}
                      onClick={(e) => {
                        if (hasSubItems) {
                          e.preventDefault();
                          if (isExpanded) {
                            toggleExpand(item.name);
                          }
                        } else {
                          onClose();
                        }
                      }}
                      aria-expanded={hasSubItems ? isMenuExpanded : undefined}
                      aria-current={(!hasSubItems && isActive) ? 'page' : undefined}
                      title={isExpanded ? undefined : item.name}
                    >
                      <item.icon className={`shrink-0 transition-colors ${
                        isExpanded ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
                      {isExpanded && (
                        <>
                          <span className="font-medium text-sm tracking-wide flex-1">{item.name}</span>
                          {hasSubItems && (
                            <ChevronDownIcon 
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isMenuExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </>
                      )}
                    </Link>

                    {/* Animated indicator bar - only when parent is strongly active */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1C4840] rounded-r-full"></div>
                    )}
                  </div>

                  {/* Sub Items - Animated Dropdown */}
                  {hasSubItems && isExpanded && (
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isMenuExpanded ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="space-y-2 ml-2">
                        {item.subItems?.map((subItem) => {
                          const subHref = subItem.href.replace(/\/+$/g, '');
                          const matchExact = !!subItem.exact;
                          const isSubActive = matchExact
                            ? (cleanPath === subHref)
                            : (cleanPath === subHref || cleanPath.startsWith(subHref + '/'));
                          
                          return (
                            <li key={subItem.name} className="relative">
                              <Link
                                href={subItem.href}
                                className={`
                                  group relative flex items-center gap-3 px-4 py-3 mx-3 rounded-lg
                                  transition-colors duration-150 cursor-pointer
                                  ${
                                    isSubActive
                                      ? 'bg-[#1C4840] text-white font-semibold border border-[#1C4840]'
                                      : 'text-gray-700 hover:bg-teal-600 hover:text-white border border-transparent'
                                  }
                                `}
                                onClick={onClose}
                                aria-current={isSubActive ? 'page' : undefined}
                              >
                                {/* Active indicator dot */}
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                                  isSubActive 
                                    ? 'bg-white ring-2 ring-emerald-300' 
                                    : 'bg-gray-500'
                                }`}></div>
                                
                                {/* Icon */}
                                <subItem.icon className={`w-5 h-5 shrink-0 transition-all ${
                                  isSubActive ? 'text-white' : 'text-gray-400'
                                }`} />
                                
                                {/* Label */}
                                <span className={`text-sm tracking-wide flex-1 ${
                                  isSubActive ? 'text-white font-bold' : 'font-medium'
                                }`}>
                                  {subItem.name}
                                </span>
                                
                                {/* Active pulse indicator */}
                                {isSubActive && (
                                  <div className="ml-auto flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                  </div>
                                )}
                              </Link>

                              {/* Animated vertical indicator bar for active sub-item */}
                              {isSubActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#1C4840] rounded-r-full"></div>
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
        <div className="border-t border-teal-300 bg-[#ECF5E9] p-4 relative">
          {isExpanded ? (
            <div className="flex items-center gap-3">
              <div className="bg-[#1C4840] text-white rounded-md flex items-center justify-center font-bold cursor-pointer hover:bg-teal-700 transition-all text-base w-12 h-12">
                FE
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 m-0 truncate">
                  Dealer Portal
                </p>
                <p className="text-xs text-gray-600 m-0 truncate">
                  Inventory System
                </p>
              </div>
              {/* Width Toggle Button - Desktop only */}
              {isDesktop && (
                <button
                  onClick={onToggleWidth}
                  className="p-2 rounded-md bg-[#1C4840] text-white hover:bg-teal-700 transition-all"
                  title="Compact sidebar"
                  aria-label="Compact sidebar"
                >
                  <ChevronDoubleLeftIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[#1C4840] text-white rounded-md flex items-center justify-center font-bold cursor-pointer hover:bg-teal-700 transition-all text-base w-10 h-10">
                FE
              </div>
              {isDesktop && (
                <button
                  onClick={onToggleWidth}
                  className="p-1.5 rounded-md bg-[#1C4840] text-white hover:bg-teal-700 transition-all"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <ChevronDoubleRightIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

