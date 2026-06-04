'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const PageTransitionLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Skip transition on initial mount
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setShowContent(true);
      return;
    }

    // Show loading spinner
    setIsLoading(true);
    setShowContent(false);

    // Keep a brief minimum so the transition reads as intentional, not janky
    const minLoadTime = 250;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        setIsLoading(false);
        // Small delay before showing content for smoother transition
        setTimeout(() => {
          setShowContent(true);
        }, 50);
      }, remainingTime);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, isInitialLoad]);

  return (
    <div className="relative flex-1 overflow-y-auto">
      {/* Loading Overlay - Only covers content area, not sidebar */}
      {isLoading && (
        <div className="absolute inset-0 z-9999 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
            <span className="text-sm font-medium text-gray-500">Loading…</span>
          </div>
        </div>
      )}

      {/* Content - Fade in after loading */}
      <div
        className={`min-h-full transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
