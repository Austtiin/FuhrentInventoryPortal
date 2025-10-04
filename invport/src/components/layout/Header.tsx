'use client';

import React, { useState } from 'react';
import { Bars3Icon, BellIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = () => {
    // TODO: Implement OAuth sign out
    console.log('Sign out clicked');
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-50 h-16">
      <div className="flex items-center justify-between h-full px-6 max-w-full">
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center justify-center w-10 h-10 bg-transparent border-none rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-100 lg:hidden"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-mint to-primary-mint-dark bg-clip-text text-transparent tracking-tight lg:text-2xl cursor-default">
              Fuhr Enterprise Dealer Inventory
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            className="relative flex items-center justify-center w-10 h-10 bg-transparent border-none rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-100 group"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5 text-slate-600 group-hover:text-primary-mint transition-colors" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none animate-pulse">
              3
            </span>
          </button>
          
          <div className="relative">
            <button 
              className="flex items-center gap-3 px-3 py-2 bg-transparent border-none rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-100 group"
              aria-label="User menu"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-mint to-primary-mint-dark text-white rounded-lg flex items-center justify-center text-sm font-bold">
                AU
              </div>
              <span className="hidden text-sm font-semibold text-slate-900 lg:block group-hover:text-primary-mint transition-colors">
                Admin User
              </span>
            </button>
            
            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200/50 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200/50">
                  <p className="text-sm font-semibold text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">admin@fuhrenterprises.com</p>
                </div>
                <div className="py-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-mint transition-colors cursor-pointer"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay to close dropdown */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;