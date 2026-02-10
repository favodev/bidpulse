"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Trophy,
  Clock,
  Gavel,
  DollarSign,
  AlertCircle,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n";
import { Notification, NotificationType } from "@/types/notification.types";
import { formatDistanceToNow } from "@/lib/utils";

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    pushSupported,
    pushPermission,
    requestPushPermission,
  } = useNotifications();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Iconos por tipo
  const getIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "outbid":
        return <AlertCircle className={`${iconClass} text-orange-400`} />;
      case "auction_won":
        return <Trophy className={`${iconClass} text-emerald-400`} />;
      case "auction_ending":
        return <Clock className={`${iconClass} text-yellow-400`} />;
      case "auction_ended":
        return <Gavel className={`${iconClass} text-blue-400`} />;
      case "new_bid":
        return <DollarSign className={`${iconClass} text-green-400`} />;
      case "new_message":
        return <MessageCircle className={`${iconClass} text-emerald-400`} />;
      case "welcome":
        return <Sparkles className={`${iconClass} text-purple-400`} />;
      default:
        return <Bell className={`${iconClass} text-slate-400`} />;
    }
  };

  const handleNotificationClick = async (
    notificationId: string,
    options?: { auctionId?: string; conversationId?: string }
  ) => {
    await markAsRead(notificationId);
    if (options?.conversationId) {
      window.dispatchEvent(
        new CustomEvent("open-message-center", {
          detail: { conversationId: options.conversationId },
        })
      );
      setIsOpen(false);
      return;
    }
    if (options?.auctionId) setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAll();
  };

  const handleEnablePush = async () => {
    await requestPushPermission();
  };

  const formatNewMessageBody = (notification: Notification) => {
    const template = t.notifications?.newMessageBody;
    if (template) {
      return template
        .replace("{sender}", notification.data?.senderName || "")
        .replace("{auction}", notification.data?.auctionTitle || "");
    }
    return notification.message;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
        aria-label={t.notifications?.title || "Notificaciones"}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-semibold">
              {t.notifications?.title || "Notificaciones"}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title={t.notifications?.markAllRead || "Marcar todas como leídas"}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title={t.notifications?.clearAll || "Limpiar todo"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Aviso de push notifications */}
          {pushSupported && pushPermission !== "granted" && (
            <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300">
                  {t.notifications?.enablePush || "Activa las notificaciones push"}
                </p>
                <button
                  onClick={handleEnablePush}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  {t.notifications?.enable || "Activar"}
                </button>
              </div>
            </div>
          )}

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-white rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  {t.notifications?.empty || "No tienes notificaciones"}
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`border-b border-slate-800 last:border-0 ${
                      !notification.read ? "bg-slate-800/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Icono */}
                      <div className="shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        {notification.data?.conversationId ? (
                          <button
                            onClick={() =>
                              handleNotificationClick(notification.id, {
                                conversationId: notification.data?.conversationId,
                              })
                            }
                            className="block w-full text-left hover:bg-slate-800/50 -m-1 p-1 rounded-lg transition-colors"
                          >
                            <p className="text-sm font-medium text-white truncate">
                              {t.notifications?.newMessageTitle || "Nuevo mensaje"}
                            </p>
                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                              {formatNewMessageBody(notification)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {notification.createdAt &&
                                formatDistanceToNow(notification.createdAt.toDate())}
                            </p>
                          </button>
                        ) : notification.data?.auctionId ? (
                          <Link
                            href={`/auction/${notification.data.auctionId}`}
                            onClick={() =>
                              handleNotificationClick(
                                notification.id,
                                { auctionId: notification.data?.auctionId }
                              )
                            }
                            className="block hover:bg-slate-800/50 -m-1 p-1 rounded-lg transition-colors"
                          >
                            <p className="text-sm font-medium text-white truncate">
                              {notification.type === "new_message"
                                ? t.notifications?.newMessageTitle || "Nuevo mensaje"
                                : notification.title}
                            </p>
                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                              {notification.type === "new_message"
                                ? formatNewMessageBody(notification)
                                : notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {notification.createdAt &&
                                formatDistanceToNow(notification.createdAt.toDate())}
                            </p>
                          </Link>
                        ) : (
                          <div
                            onClick={() => handleNotificationClick(notification.id)}
                            className="cursor-pointer"
                          >
                            <p className="text-sm font-medium text-white truncate">
                              {notification.type === "new_message"
                                ? t.notifications?.newMessageTitle || "Nuevo mensaje"
                                : notification.title}
                            </p>
                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                              {notification.type === "new_message"
                                ? formatNewMessageBody(notification)
                                : notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {notification.createdAt &&
                                formatDistanceToNow(notification.createdAt.toDate())}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                            title={t.notifications?.markRead || "Marcar como leída"}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title={t.notifications?.delete || "Eliminar"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
