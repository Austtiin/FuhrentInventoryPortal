'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

const breadcrumbNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/inventory/add': 'Add Item',
  '/inventory/edit': 'Edit Item',
  '/reports': 'Reports',
  '/users': 'Users',
  '/settings': 'Settings',
};

const getBreadcrumbName = (pathname: string): string => {
  return breadcrumbNameMap[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
};

interface BreadcrumbProps {
  inHeader?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ inHeader = false }) => {
  const pathname = usePathname();
  const pathnames = pathname.split('/').filter((x) => x);

  // Get the current page name for the title
  const currentRoute = pathnames.length === 0 ? '/' : `/${pathnames.join('/')}`;
  const currentPageName = getBreadcrumbName(currentRoute);

  // When inHeader is true, only show the title
  if (inHeader) {
    return <h1 className="text-2xl font-bold text-gray-900">{currentPageName}</h1>;
  }

  // When inHeader is false, only show the breadcrumb trail
  if (pathname === '/') {
    return (
      <nav>
        <ol className="flex items-center list-none m-0 p-0 flex-wrap gap-2">
          <li className="flex items-center">
            <span className="flex items-center gap-2 text-slate-600 text-xs">
              <HomeIcon className="w-3 h-3" />
              Dashboard
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
      <nav>
        <ol className="flex items-center list-none m-0 p-0 flex-wrap gap-2">
          <li className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center gap-1 text-slate-600 no-underline text-xs hover:text-[#1C4840] transition-colors"
            >
              <HomeIcon className="w-3 h-3" />
              Dashboard
            </Link>
          </li>
          
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            
            return (
              <React.Fragment key={routeTo}>
                <li className="flex items-center text-slate-400">
                  <ChevronRightIcon className="w-3 h-3" />
                </li>
                <li className="flex items-center">
                  {isLast ? (
                    <span className="text-[#1C4840] text-xs font-semibold">
                      {getBreadcrumbName(routeTo)}
                    </span>
                  ) : (
                    <Link 
                      href={routeTo} 
                      className="text-slate-600 no-underline text-xs hover:text-[#1C4840] transition-colors"
                    >
                      {getBreadcrumbName(routeTo)}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
  );
};

export default Breadcrumb;