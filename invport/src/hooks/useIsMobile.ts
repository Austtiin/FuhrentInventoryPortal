import { useEffect, useState } from 'react';

// Detects if viewport width is at or below the given breakpoint (default ~ Tailwind 'sm': 640px)
export default function useIsMobile(breakpoint: number = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Set initial value
    setIsMobile(mq.matches);
    // Subscribe
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(listener);
      return () => mq.removeListener(listener);
    }
  }, [breakpoint]);

  return isMobile;
}
