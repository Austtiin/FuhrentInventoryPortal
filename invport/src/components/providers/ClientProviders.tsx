'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { initializeErrorHandlers } from '@/lib/globalErrorHandler';

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
        {children}
      </AuthProvider>
    </React.StrictMode>
  );
}