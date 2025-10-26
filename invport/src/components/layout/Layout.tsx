'use client';

import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumb from './Breadcrumb';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };


  // Allow Esc to close the mobile sidebar for convenience
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 relative">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
        />
        <main className={`
          flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-x-hidden
        `}>
          <div className="flex-1 pl-2 pr-4 py-2 lg:pl-3 lg:pr-6 lg:py-3 max-w-none">
            <Breadcrumb />
            <div className="mt-1">
              {children}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout;

