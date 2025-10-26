'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { initializeErrorHandlers } from '@/lib/globalErrorHandler';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  // Initialize global error handlers on client mount
  useEffect(() => {
    initializeErrorHandlers();
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </AuthProvider>
    </React.StrictMode>
  );
}