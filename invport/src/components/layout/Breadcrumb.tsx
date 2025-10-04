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

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  const pathnames = pathname.split('/').filter((x) => x);

  if (pathname === '/') {
    return (
      <nav className="mb-6">
        <ol className="flex items-center list-none m-0 p-0 flex-wrap gap-2">
          <li className="flex items-center">
            <span className="flex items-center gap-2 text-slate-900 text-sm font-semibold px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200/50">
              <HomeIcon className="w-4 h-4 text-primary-mint" />
              Dashboard
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav className="mb-4">
      <ol className="flex items-center list-none m-0 p-0 flex-wrap gap-2">
        <li className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-600 no-underline text-sm px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200/50 transition-all hover:text-primary-mint hover:border-primary-mint/30 hover:shadow-md"
          >
            <HomeIcon className="w-4 h-4" />
            Dashboard
          </Link>
        </li>
        
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;;
          const isLast = index === pathnames.length - 1;
          
          return (
            <React.Fragment key={routeTo}>
              <li className="flex items-center text-slate-400">
                <ChevronRightIcon className="w-4 h-4" />
              </li>
              <li className="flex items-center">
                {isLast ? (
                  <span className="flex items-center gap-2 text-white text-sm font-semibold px-3 py-2 bg-gradient-to-r from-primary-mint to-primary-mint-dark rounded-lg shadow-sm">
                    {getBreadcrumbName(routeTo)}
                  </span>
                ) : (
                  <Link 
                    href={routeTo} 
                    className="flex items-center gap-2 text-slate-600 no-underline text-sm px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200/50 transition-all hover:text-primary-mint hover:border-primary-mint/30 hover:shadow-md"
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