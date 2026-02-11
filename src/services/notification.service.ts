import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Notification,
  CreateNotificationData,
  NotificationResult,
  NotificationType,
} from "@/types/notification.types";

const NOTIFICATIONS_COLLECTION = "notifications";
const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

/**
 * Crear una nueva notificación
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<NotificationResult> {
  try {
    await addDoc(notificationsRef, {
      ...data,
      read: false,
      sent: false,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error creating notification:", error);
    return { success: false, error: "Error al crear la notificación" };
  }
}

/**
 * Notificar a un usuario que ha sido superado en una puja
 */
export async function notifyOutbid(
  userId: string,
  auctionId: string,
  auctionTitle: string,
  newBidAmount: number,
  bidderName: string
): Promise<NotificationResult> {
  return createNotification({
    userId,
    type: "outbid",
    title: "¡Te han superado!",
    message: `${bidderName} ha pujado $${newBidAmount.toLocaleString()} en "${auctionTitle}"`,
    data: {
      auctionId,
      auctionTitle,
      bidAmount: newBidAmount,
      bidderName,
    },
  });
}

/**
 * Notificar al vendedor de una nueva puja
 */
export async function notifyNewBid(
  sellerId: string,
  auctionId: string,
  auctionTitle: string,
  bidAmount: number,
  bidderName: string
): Promise<NotificationResult> {
  return createNotification({
    userId: sellerId,
    type: "new_bid",
    title: "Nueva puja recibida",
    message: `${bidderName} ha pujado $${bidAmount.toLocaleString()} en tu subasta "${auctionTitle}"`,
    data: {
      auctionId,
      auctionTitle,
      bidAmount,
      bidderName,
    },
  });
}

/**
 * Notificar a un usuario de un nuevo mensaje
 */
export async function notifyNewMessage(
  userId: string,
  conversationId: string,
  auctionId: string,
  auctionTitle: string,
  senderId: string,
  senderName: string,
  messageText: string
): Promise<NotificationResult> {
  return createNotification({
    userId,
    type: "new_message",
    title: "Nuevo mensaje",
    message: `${senderName}: ${messageText}`,
    data: {
      conversationId,
      auctionId,
      auctionTitle,
      senderId,
      senderName,
    },
  });
}

/**
 * Notificar al ganador de una subasta
 */
export async function notifyAuctionWon(
  userId: string,
  auctionId: string,
  auctionTitle: string,
  winningBid: number
): Promise<NotificationResult> {
  return createNotification({
    userId,
    type: "auction_won",
    title: "¡Felicidades! Ganaste",
    message: `Has ganado la subasta "${auctionTitle}" con una puja de $${winningBid.toLocaleString()}`,
    data: {
      auctionId,
      auctionTitle,
      bidAmount: winningBid,
    },
  });
}

/**
 * Notificar al vendedor que su subasta terminó
 */
export async function notifyAuctionEnded(
  sellerId: string,
  auctionId: string,
  auctionTitle: string,
  finalBid: number,
  winnerName?: string
): Promise<NotificationResult> {
  const message = winnerName
    ? `Tu subasta "${auctionTitle}" ha terminado. ${winnerName} ganó con $${finalBid.toLocaleString()}`
    : `Tu subasta "${auctionTitle}" ha terminado sin pujas`;

  return createNotification({
    userId: sellerId,
    type: "auction_ended",
    title: "Subasta finalizada",
    message,
    data: {
      auctionId,
      auctionTitle,
      bidAmount: finalBid,
      bidderName: winnerName,
    },
  });
}

/**
 * Notificar que una subasta está por terminar
 */
export async function notifyAuctionEndingSoon(
  userId: string,
  auctionId: string,
  auctionTitle: string,
  minutesRemaining: number
): Promise<NotificationResult> {
  return createNotification({
    userId,
    type: "auction_ending",
    title: "¡Subasta por terminar!",
    message: `La subasta "${auctionTitle}" termina en ${minutesRemaining} minutos`,
    data: {
      auctionId,
      auctionTitle,
    },
  });
}

/**
 * Obtener notificaciones de un usuario
 */
export async function getUserNotifications(
  userId: string,
  limitCount = 50
): Promise<Notification[]> {
  try {
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as Notification);
    });

    return notifications;
  } catch (error) {
    console.error("[NotificationService] Error getting notifications:", error);
    return [];
  }
}

/**
 * Obtener conteo de notificaciones no leídas
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("[NotificationService] Error getting unread count:", error);
    return 0;
  }
}

/**
 * Marcar una notificación como leída
 */
export async function markAsRead(
  notificationId: string
): Promise<NotificationResult> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error marking as read:", error);
    return { success: false, error: "Error al marcar como leída" };
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllAsRead(userId: string): Promise<NotificationResult> {
  try {
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    
    // Firestore batches are limited to 500 operations - chunk if needed
    const docs = querySnapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500);
      const batch = writeBatch(db);
      chunk.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { read: true });
      });
      await batch.commit();
    }
    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error marking all as read:", error);
    return { success: false, error: "Error al marcar todas como leídas" };
  }
}

/**
 * Eliminar una notificación
 */
export async function deleteNotification(
  notificationId: string
): Promise<NotificationResult> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error deleting notification:", error);
    return { success: false, error: "Error al eliminar la notificación" };
  }
}

/**
 * Eliminar todas las notificaciones de un usuario
 */
export async function clearAllNotifications(
  userId: string
): Promise<NotificationResult> {
  try {
    const q = query(notificationsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    // Firestore batches are limited to 500 operations - chunk if needed
    const docs = querySnapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500);
      const batch = writeBatch(db);
      chunk.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      await batch.commit();
    }
    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Error clearing notifications:", error);
    return { success: false, error: "Error al limpiar notificaciones" };
  }
}

/**
 * Suscribirse a notificaciones en tiempo real
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  limitCount = 20
): Unsubscribe {
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });
      callback(notifications);
    },
    (error) => {
      console.error("[NotificationService] Subscription error:", error);
    }
  );
}

/**
 * Suscribirse al conteo de no leídas en tiempo real
 */
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): Unsubscribe {
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    where("read", "==", false)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      callback(querySnapshot.size);
    },
    (error) => {
      console.error("[NotificationService] Unread count subscription error:", error);
    }
  );
}

/**
 * Solicitar permiso para notificaciones push del navegador
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones push");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Verificar si las notificaciones push están habilitadas
 */
export function isPushSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Obtener el permiso actual de notificaciones
 */
export function getPushPermission(): NotificationPermission | null {
  if (!("Notification" in window)) return null;
  return Notification.permission;
}

/**
 * Mostrar una notificación push local
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/assets/logo.png",
      badge: "/assets/logo.png",
      ...options,
    });
  }
}

/**
 * Iconos para cada tipo de notificación
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    outbid: "🔔",
    auction_won: "🏆",
    auction_ending: "⏰",
    auction_ended: "🔨",
    new_bid: "💰",
    new_message: "💬",
    welcome: "👋",
    system: "ℹ️",
  };
  return icons[type] || "🔔";
}

/**
 * Colores para cada tipo de notificación
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    outbid: "text-orange-400",
    auction_won: "text-emerald-400",
    auction_ending: "text-yellow-400",
    auction_ended: "text-blue-400",
    new_bid: "text-green-400",
    new_message: "text-emerald-400",
    welcome: "text-purple-400",
    system: "text-slate-400",
  };
  return colors[type] || "text-slate-400";
}
