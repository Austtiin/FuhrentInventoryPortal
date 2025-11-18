'use client';

import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  className = ''
}) => {
  const content = (
    <Box 
      className={className}
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2
      }}
    >
      <CircularProgress size={sizeMap[size]} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

// Skeleton loader for cards
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Box className={className}>
    <Skeleton variant="text" width="75%" height={24} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="50%" height={20} />
  </Box>
);

// Skeleton for stat cards
export const StatCardSkeleton: React.FC = () => (
  <Card sx={{ boxShadow: 1 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
      </Box>
      <Skeleton variant="text" width={80} height={32} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={100} height={20} />
    </CardContent>
  </Card>
);

// Full page loading state
export const PageLoading: React.FC<{ message?: string }> = ({ message }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
    }}
  >
    <LoadingSpinner size="lg" message={message || "Loading..."} />
  </Box>
);

