'use client';

import React, { useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Slide, { SlideProps } from '@mui/material/Slide';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number; // Auto-close duration in ms (0 = no auto-close)
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  onClose,
  duration = 5000
}) => {
  const [progress, setProgress] = React.useState(100);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      // Animate progress bar
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress < 0 ? 0 : newProgress;
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [duration, onClose]);

  return (
    <Alert 
      severity={type} 
      onClose={onClose}
      variant="filled"
      sx={{ 
        minWidth: 320,
        maxWidth: 500,
        boxShadow: 6,
      }}
    >
      <AlertTitle sx={{ fontWeight: 700, mb: message ? 0.5 : 0 }}>
        {title}
      </AlertTitle>
      {message && <Box sx={{ fontSize: '0.875rem' }}>{message}</Box>}
      {duration > 0 && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mt: 1.5,
            height: 3,
            borderRadius: 1,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'rgba(255, 255, 255, 0.8)',
            }
          }} 
        />
      )}
    </Alert>
  );
};

// Notification container component
interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose
}) => {
  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{ 
            top: { xs: 80 + (index * 90), sm: 80 + (index * 90) },
          }}
        >
          <div>
            <Notification
              type={notification.type}
              title={notification.title}
              message={notification.message}
              onClose={() => onClose(notification.id)}
              duration={notification.duration}
            />
          </div>
        </Snackbar>
      ))}
    </>
  );
};

