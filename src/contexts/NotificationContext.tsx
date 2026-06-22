import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  push: (
    notif: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => void;
  dismiss: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = useCallback(
    (
      notif: Omit<Notification, 'id' | 'createdAt' | 'read'>
    ) => {
      const id = `notif_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      const full: Notification = {
        id,
        createdAt: new Date().toISOString(),
        read: false,
        ...notif,
      };

      setNotifications(prev => [full, ...prev].slice(0, 50));
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== id)
    );
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, read: true }
          : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        read: true,
      }))
    );
  }, []);

  const unreadCount = notifications.filter(
    n => !n.read
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        push,
        dismiss,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    throw new Error(
      'useNotification must be used within NotificationProvider'
    );
  }

  return ctx;
}