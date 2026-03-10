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
      variant="outlined"
      sx={{ 
        minWidth: 320,
        maxWidth: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        bgcolor: 'background.paper',
        borderWidth: 1,
        borderLeftWidth: 4,
        borderRadius: 2,
        '& .MuiAlert-icon': {
          fontSize: '1.5rem',
        },
      }}
    >
      <AlertTitle sx={{ fontWeight: 600, mb: message ? 0.5 : 0, fontSize: '0.95rem' }}>
        {title}
      </AlertTitle>
      {message && <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{message}</Box>}
      {duration > 0 && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mt: 1.5,
            height: 2,
            borderRadius: 1,
            bgcolor: type === 'success' ? 'success.lighter' : 
                     type === 'error' ? 'error.lighter' : 
                     type === 'warning' ? 'warning.lighter' : 'info.lighter',
            '& .MuiLinearProgress-bar': {
              bgcolor: type === 'success' ? 'success.main' : 
                       type === 'error' ? 'error.main' : 
                       type === 'warning' ? 'warning.main' : 'info.main',
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

