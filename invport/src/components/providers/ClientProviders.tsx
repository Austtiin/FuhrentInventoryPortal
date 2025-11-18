'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/contexts/AuthContext';
import { initializeErrorHandlers } from '@/lib/globalErrorHandler';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { theme } from '@/theme/theme';

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

