'use client';

import { useEffect } from 'react';

/**
 * Client component that registers the service worker on mount.
 * Avoids Next.js sync script warnings by running in client context.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => navigator.serviceWorker.ready)
          .then((reg) => {
            // On full page load, request SW to clear image cache
            // so subsequent image requests fetch fresh copies.
            if (reg && reg.active) {
              reg.active.postMessage({ type: 'refresh-images' });
            }
          })
          .catch(() => {
            // Silent fail - service worker not critical
          });
      });
    }
  }, []);

  return null;
}
