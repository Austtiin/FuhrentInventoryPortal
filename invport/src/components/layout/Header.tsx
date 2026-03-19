"use client";

import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Breadcrumb from './Breadcrumb';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarWidth: number;
  isDesktop: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarWidth, isDesktop }) => {
  return (
    <header className="bg-transparent sticky top-0 z-30 transition-all duration-300">
      <div className="flex flex-col h-full px-3 sm:px-6 pt-2 sm:pt-3 pb-2 sm:pb-3 max-w-full">
        <div className="flex items-center justify-between mb-1 sm:mb-2 gap-2">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 border-none rounded-md cursor-pointer transition-all duration-200 lg:hidden backdrop-blur-sm"
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              <Bars3Icon className="w-6 h-6 text-black" />
            </button>
            <Breadcrumb inHeader={true} />
          </div>

          {/* Auth controls */}
          <div className="flex items-center gap-3">
            <a
              href="/.auth/logout?post_logout_redirect_uri=/loggedout"
              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#1C4840] text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-400"
              aria-label="Sign out"
            >
              Sign out
            </a>
          </div>
        </div>
        
        <div className="hidden sm:block">
          <Breadcrumb inHeader={false} />
        </div>
      </div>
    </header>
  );
};

export default Header;

