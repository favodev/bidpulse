"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "./useAuth";
import {
  Notification,
  NotificationResult,
} from "@/types/notification.types";
import {
  subscribeToNotifications,
  subscribeToUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  requestPushPermission,
  isPushSupported,
  getPushPermission,
  showLocalNotification,
} from "@/services/notification.service";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  
  // Acciones
  markAsRead: (notificationId: string) => Promise<NotificationResult>;
  markAllAsRead: () => Promise<NotificationResult>;
  deleteNotification: (notificationId: string) => Promise<NotificationResult>;
  clearAll: () => Promise<NotificationResult>;
  
  // Push notifications
  pushSupported: boolean;
  pushPermission: NotificationPermission | null;
  requestPushPermission: () => Promise<NotificationPermission>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const prevNotificationsCountRef = useRef(0);
  const pushPermissionRef = useRef<NotificationPermission | null>(null);

  // Verificar soporte de push
  const pushSupported = typeof window !== "undefined" && isPushSupported();

  // Cargar permiso de push al inicio
  useEffect(() => {
    if (pushSupported) {
      const perm = getPushPermission();
      setPushPermission(perm);
      pushPermissionRef.current = perm;
    }
  }, [pushSupported]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Suscribirse a las notificaciones
    const unsubscribeNotifications = subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        // Detectar nuevas notificaciones para mostrar push local (use ref to avoid stale closure)
        if (prevNotificationsCountRef.current > 0 && newNotifications.length > prevNotificationsCountRef.current) {
          const latestNotification = newNotifications[0];
          if (
            latestNotification &&
            !latestNotification.read &&
            pushPermissionRef.current === "granted"
          ) {
            showLocalNotification(latestNotification.title, {
              body: latestNotification.message,
              tag: latestNotification.id,
            });
          }
        }
        prevNotificationsCountRef.current = newNotifications.length;
        setNotifications(newNotifications);
        setLoading(false);
      }
    );

    // Suscribirse al conteo de no leídas
    const unsubscribeUnread = subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeUnread();
    };
  }, [user]);

  // Marcar como leída
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    const result = await markAsRead(notificationId);
    return result;
  }, []);

  // Marcar todas como leídas
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return { success: false, error: "No user" };
    const result = await markAllAsRead(user.uid);
    return result;
  }, [user]);

  // Eliminar notificación
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    return result;
  }, []);

  // Limpiar todas
  const handleClearAll = useCallback(async () => {
    if (!user) return { success: false, error: "No user" };
    const result = await clearAllNotifications(user.uid);
    return result;
  }, [user]);

  // Solicitar permiso push
  const handleRequestPushPermission = useCallback(async () => {
    const permission = await requestPushPermission();
    setPushPermission(permission);
    pushPermissionRef.current = permission;
    return permission;
  }, []);

  const value = useMemo<NotificationsContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    clearAll: handleClearAll,
    pushSupported,
    pushPermission,
    requestPushPermission: handleRequestPushPermission,
  }), [notifications, unreadCount, loading, handleMarkAsRead, handleMarkAllAsRead, handleDeleteNotification, handleClearAll, pushSupported, pushPermission, handleRequestPushPermission]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
