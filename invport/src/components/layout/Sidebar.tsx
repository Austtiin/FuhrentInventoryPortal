'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Add Item', href: '/inventory/add' },
  { name: 'Reports', href: '/reports' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname().replace(/\/+$/, '') || '/';
  const activeHref = navigationItems
    .filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      id="site-navigation"
      aria-label="Main navigation"
      className={`${isOpen ? 'block' : 'hidden'} border-b border-gray-200 bg-white lg:block`}
    >
      <ul className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-2 sm:px-6 lg:flex-row lg:gap-6 lg:py-0">
        {navigationItems.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              aria-current={activeHref === item.href ? 'page' : undefined}
              className={`block border-l-2 px-3 py-3 text-sm font-medium transition-colors lg:border-l-0 lg:border-b-2 lg:px-1 ${
                activeHref === item.href
                  ? 'border-slate-700 text-slate-900'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
