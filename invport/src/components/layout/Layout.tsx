'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumb from './Breadcrumb';
import { PageTransitionLoader } from '@/components/ui/PageTransitionLoader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:bg-white focus:px-6 focus:py-3">
        Skip to content
      </a>
      <Header
        onMenuClick={() => setMenuOpen(open => !open)}
        menuOpen={menuOpen}
        menuButtonRef={menuButtonRef}
      />
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 outline-none sm:px-6 lg:py-8">
        <div className="mb-6 space-y-2">
          <Breadcrumb />
          <Breadcrumb inHeader />
        </div>
        <PageTransitionLoader>{children}</PageTransitionLoader>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
