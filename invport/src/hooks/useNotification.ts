'use client';

import { useState, useCallback } from 'react';
import { NotificationType } from '@/components/ui/Notification';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    return id;
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification('success', title, message, duration);
  }, [showNotification]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification('error', title, message, duration);
  }, [showNotification]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification('warning', title, message, duration);
  }, [showNotification]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification('info', title, message, duration);
  }, [showNotification]);

  const closeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    success,
    error,
    warning,
    info,
    closeNotification,
    clearAll
  };
}
