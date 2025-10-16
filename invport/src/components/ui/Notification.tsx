'use client';

import React, { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number; // Auto-close duration in ms (0 = no auto-close)
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      message: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      message: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-700'
    }
  };

  const Icon = icons[type];
  const style = styles[type];

  return (
    <div className={`fixed top-20 right-4 z-50 min-w-[320px] max-w-md animate-slideIn`}>
      <div className={`${style.bg} ${style.border} border-2 rounded-lg shadow-xl p-4`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 flex-shrink-0 ${style.icon}`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm ${style.title}`}>{title}</h4>
            {message && (
              <p className={`text-sm mt-1 ${style.message}`}>{message}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors ${style.icon}`}
            aria-label="Close notification"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Progress bar for auto-close */}
        {duration > 0 && (
          <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
            <div 
              className={`h-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
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
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id} 
          className="pointer-events-auto"
          style={{
            animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
          }}
        >
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => onClose(notification.id)}
            duration={notification.duration}
          />
        </div>
      ))}
    </div>
  );
};
