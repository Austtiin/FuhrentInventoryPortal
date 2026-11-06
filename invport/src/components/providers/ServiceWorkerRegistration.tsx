'use client';

import { useEffect } from 'react';

/**
 * Client component that registers the service worker on mount.
 * Avoids Next.js sync script warnings by running in client context.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((error) => {
            console.warn('Image cache service worker registration failed:', error);
          });
      };
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
