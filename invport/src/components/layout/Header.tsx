"use client";

import React from 'react';
import Image from 'next/image';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-brand-black backdrop-blur-lg border-b border-brand-blue/30 shadow-lg sticky top-0 z-50 h-20">
      <div className="flex items-center justify-between h-full px-6 max-w-full">
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 border-none rounded-md cursor-pointer transition-all duration-200 lg:hidden backdrop-blur-sm"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-6 h-6 text-black" />
          </button>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image
                src="/logo/FELogo.png"
                alt="Fuhr Enterprise logo"
                width={200}
                height={60}
                className="hover:opacity-90 transition-opacity duration-200"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

