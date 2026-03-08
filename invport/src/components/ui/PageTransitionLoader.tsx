'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

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

    // Simulate minimum loading time for spinner visibility (so your friend can see it spin!)
    const minLoadTime = 800; // 800ms minimum to see the spinner
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
        <div className="absolute inset-0 z-9999 bg-white flex items-center justify-center">
          <div className="relative w-40 h-40 animate-spin-fast">
            <Image
              src="/logo/2.png"
              alt="Loading..."
              fill
              className="object-contain"
              priority
            />
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

      {/* Add custom fast spin animation */}
      <style jsx global>{`
        @keyframes spin-fast {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-fast {
          animation: spin-fast 0.6s linear infinite;
        }
      `}</style>
    </div>
  );
};
