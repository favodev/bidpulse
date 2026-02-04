import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyNewMessage } from "@/services/notification.service";
import type {
  Conversation,
  CreateConversationData,
  Message,
  CreateMessageData,
} from "@/types/message.types";

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_COLLECTION = "messages";

const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
const messagesRef = collection(db, MESSAGES_COLLECTION);

export async function createOrGetConversation(
  data: CreateConversationData
): Promise<string> {
  try {
    const q = query(
      conversationsRef,
      where("auctionId", "==", data.auctionId),
      where("buyerId", "==", data.buyerId),
      where("sellerId", "==", data.sellerId)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    const docRef = await addDoc(conversationsRef, {
      ...data,
      participants: [data.buyerId, data.sellerId],
      lastMessage: "",
      lastMessageAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[MessageService] Error creating conversation:", error);
    throw error;
  }
}

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Conversation;
  } catch (error) {
    console.error("[MessageService] Error getting conversation:", error);
    throw error;
  }
}

export async function getUserConversations(
  userId: string,
  limitCount = 50
): Promise<Conversation[]> {
  try {
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    snapshot.forEach((docSnap) => {
      conversations.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as Conversation);
    });

    return conversations;
  } catch (error) {
    console.error("[MessageService] Error getting conversations:", error);
    return [];
  }
}

export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
  limitCount = 50
): Unsubscribe {
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        conversations.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Conversation);
      });
      callback(conversations);
    },
    (error) => {
      console.error("[MessageService] Subscription error:", error);
    }
  );
}

export function subscribeToConversationMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Message);
      });
      callback(messages);
    },
    (error) => {
      console.error("[MessageService] Messages subscription error:", error);
    }
  );
}

export async function sendMessage(
  conversationId: string,
  data: CreateMessageData
): Promise<string> {
  try {
    const conversation = await getConversation(conversationId);

    const docRef = await addDoc(messagesRef, {
      conversationId,
      ...data,
      createdAt: serverTimestamp(),
    });

    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      lastMessage: data.text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (conversation) {
      const receiverId = conversation.participants.find(
        (participantId) => participantId !== data.senderId
      );

      if (receiverId) {
        await notifyNewMessage(
          receiverId,
          conversationId,
          conversation.auctionId,
          conversation.auctionTitle,
          data.senderId,
          data.senderName,
          data.text
        );
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("[MessageService] Error sending message:", error);
    throw error;
  }
}
