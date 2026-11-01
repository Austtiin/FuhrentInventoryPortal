'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
  menuOpen: boolean;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, menuOpen, menuButtonRef }) => (
  <header className="border-b border-gray-200 bg-white">
    <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Fuhr Enterprise home">
        <Image src="/logo/FELogo.png" alt="" width={112} height={56} className="h-12 w-24 object-contain" />
        <span className="hidden border-l border-gray-200 pl-3 text-sm font-medium text-gray-600 sm:block">
          Dealer inventory
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <a
          href="/.auth/logout?post_logout_redirect_uri=/loggedout"
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </a>
        <button
          ref={menuButtonRef}
          onClick={onMenuClick}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          className="rounded border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 lg:hidden"
        >
          {menuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  </header>
);

export default Header;
