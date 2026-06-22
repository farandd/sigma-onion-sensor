import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X, Trash2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { Notification } from '../../contexts/NotificationContext';

const notificationConfig = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-accent-straken" />,
    border: 'border-accent-straken/20',
    bg: 'bg-accent-straken/10',
    bar: 'bg-accent-straken',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-accent-rosemary" />,
    border: 'border-accent-rosemary/30',
    bg: 'bg-accent-rosemary/10',
    bar: 'bg-accent-rosemary',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    border: 'border-red-200',
    bg: 'bg-red-50',
    bar: 'bg-red-500',
  },
  info: {
    icon: <Info className="w-5 h-5 text-accent-viola" />,
    border: 'border-accent-viola/20',
    bg: 'bg-accent-viola/10',
    bar: 'bg-accent-viola',
  },
};

function NotificationItem({
  notif,
  onDismiss,
  onMarkAsRead,
}: {
  notif: Notification;
  onDismiss: () => void;
  onMarkAsRead: () => void;
}) {
  const cfg = notificationConfig[notif.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onMarkAsRead}
      className={`relative bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        notif.read
          ? `${cfg.border} opacity-60 hover:opacity-75`
          : `${cfg.border} ${cfg.bg}`
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${cfg.bar}`} />

      <div className="flex items-start gap-3 p-3">
        <div className="shrink-0 mt-0.5">{cfg.icon}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
          {notif.message && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
          )}
          <p className="text-[10px] text-gray-400 mt-2 font-medium">
            {new Date(notif.createdAt).toLocaleTimeString('id-ID')}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!notif.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-accent-melrose rounded-full" />
      )}
    </motion.div>
  );
}

export default function NotificationCenter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { notifications, dismiss, markAsRead, markAllAsRead } = useNotification();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasNotifications = notifications.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-full mt-3 w-96 max-w-[calc(100vw-2rem)] bg-neutral-surface rounded-2xl shadow-2xl border border-primary/10 z-50 max-h-[500px] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-gradient-to-r from-accent-melrose/20 to-transparent">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Notifikasi</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  {unreadCount} notifikasi baru
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-accent-texture hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-accent-melrose/30"
                >
                  Tandai Semua
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent-melrose/30 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasNotifications ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Info className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-500">Tidak ada notifikasi</p>
                <p className="text-xs text-gray-400 mt-1">
                  Notifikasi Anda akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                <AnimatePresence mode="popLayout">
                  {notifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onDismiss={() => dismiss(notif.id)}
                      onMarkAsRead={() => markAsRead(notif.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          {hasNotifications && (
            <div className="border-t border-primary/10 px-4 py-3 bg-accent-melrose/15 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-500">
                Total: {notifications.length} notifikasi
              </p>
              <button
                onClick={() => {
                  notifications.forEach(n => dismiss(n.id));
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all px-2.5 py-1.5 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
