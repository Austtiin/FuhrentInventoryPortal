'use client';

import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { PageTransitionLoader } from '@/components/ui/PageTransitionLoader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // true = 280px (full), false = 72px (icons only)
  const [isDesktop, setIsDesktop] = useState(false);
  
  const sidebarWidth = sidebarExpanded ? 280 : 72;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarWidth = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Detect desktop/mobile on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);


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
    <div className="min-h-screen bg-[#ECF5E9] flex flex-col p-2">
      <div className="flex flex-1 bg-[#ECF5E9] rounded-[2.5rem]">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          width={sidebarWidth}
          isExpanded={sidebarExpanded}
          onToggleWidth={toggleSidebarWidth}
          isDesktop={isDesktop}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <main 
            className="flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out bg-[#FDFDFD] p-4 rounded-tl-[2.5rem] rounded-tr-[2.5rem]"
          >
          <div className="flex-1 flex flex-col max-w-none bg-[#FCFBFC] rounded-tl-[2.5rem] rounded-tr-[2.5rem] min-h-full shadow-lg overflow-hidden">
            <Header 
              onMenuClick={toggleSidebar} 
              sidebarWidth={sidebarWidth}
              isDesktop={isDesktop}
            />
            <PageTransitionLoader>
              <div className="px-4 py-3 lg:px-6 lg:py-4">
                <div className="mt-1">
                  {children}
                </div>
              </div>
            </PageTransitionLoader>
            <Footer />
          </div>
        </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;

