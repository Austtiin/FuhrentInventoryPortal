"use client";

import { useEffect, useState, useCallback } from 'react';

interface ClientPrincipal {
  identityProvider?: string;
  userId?: string;
  userDetails?: string;
  userRoles?: string[];
  claims?: Array<{ typ?: string; val?: string }>;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<ClientPrincipal | null>(null);

  const fetchMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/.auth/me', { credentials: 'include' });
      if (!res.ok) {
        setIsAuthenticated(false);
        setPrincipal(null);
      } else {
        const data = await res.json();
        // The shape from Static Web Apps is typically { clientPrincipal: { ... } }
        const cp = (data && data.clientPrincipal) ? data.clientPrincipal as ClientPrincipal : (data as ClientPrincipal);
  setPrincipal(cp ?? null);
  setIsAuthenticated(!!(cp && (cp.userId || cp.userDetails)));
      }
    } catch (err) {
      console.warn('[useAuth] failed to fetch /.auth/me', err);
      setIsAuthenticated(false);
      setPrincipal(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const requireLogin = useCallback((postLoginRedirect?: string) => {
    const redirect = postLoginRedirect ?? window.location.pathname;
    // Use full navigation to start provider login flow — avoids fetch CORS redirect issues
    window.location.href = `/.auth/login/aad?post_login_redirect_url=${encodeURIComponent(redirect)}`;
  }, []);

  const signOut = useCallback((postLogoutRedirect?: string) => {
    const redirect = postLogoutRedirect ?? '/';
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(redirect)}`;
  }, []);

  return {
    isLoading,
    isAuthenticated,
    principal,
    requireLogin,
    signOut,
    refresh: fetchMe,
  } as const;
}
