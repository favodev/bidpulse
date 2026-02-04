"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import Link from "next/link";
import { MessageCircle, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import {
  getConversation,
  sendMessage,
  subscribeToConversationMessages,
  subscribeToUserConversations,
} from "@/services/message.service";
import { createUserReport } from "@/services/report.service";
import type { Conversation, Message } from "@/types/message.types";
import type { ReportReason } from "@/types/report.types";
import { Button, ReportUserModal } from "@/components/ui";

interface MessageCenterContextValue {
  openMessageCenter: () => void;
  closeMessageCenter: () => void;
  openConversation: (conversationId: string) => void;
}

const MessageCenterContext = createContext<MessageCenterContextValue | undefined>(undefined);

interface MessageCenterProviderProps {
  children: ReactNode;
}

function formatTime(ts: any, locale: string) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageCenterProvider({ children }: MessageCenterProviderProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "es-ES";
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const unsubscribe = subscribeToUserConversations(user.uid, (data) => {
      setConversations(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    let unsubscribeMessages: (() => void) | null = null;
    const conversationId = activeConversationId;

    async function loadConversation() {
      setLoadingConversation(true);
      try {
        const data = await getConversation(conversationId);
        setActiveConversation(data);
        if (data) {
          unsubscribeMessages = subscribeToConversationMessages(
            conversationId,
            (newMessages) => {
              setMessages(newMessages);
            }
          );
        }
      } finally {
        setLoadingConversation(false);
      }
    }

    loadConversation();

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

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

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId?: string }>;
      if (customEvent?.detail?.conversationId) {
        setActiveConversationId(customEvent.detail.conversationId);
      }
      setIsOpen(true);
    };

    window.addEventListener("open-message-center", handler as EventListener);
    return () => window.removeEventListener("open-message-center", handler as EventListener);
  }, []);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !activeConversationId) return;
    const text = messageText.trim();
    if (!text) return;

    setSending(true);
    try {
      await sendMessage(activeConversationId, {
        senderId: user.uid,
        senderName: user.displayName || t.nav?.user || "Usuario",
        senderAvatar: user.photoURL || null,
        text,
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (data: { reason: ReportReason; details: string }) => {
    if (!user || !activeConversation) return;
    const isBuyer = activeConversation.buyerId === user.uid;
    const reportedUserId = isBuyer ? activeConversation.sellerId : activeConversation.buyerId;

    setReporting(true);
    try {
      await createUserReport({
        reporterId: user.uid,
        reportedUserId,
        reason: data.reason,
        details: data.details,
        auctionId: activeConversation.auctionId,
        conversationId: activeConversation.id,
      });
      setShowReport(false);
    } catch (error) {
      console.error("Error reporting user:", error);
    } finally {
      setReporting(false);
    }
  };

  const otherUser = useMemo(() => {
    if (!activeConversation || !user) return null;
    const isBuyer = activeConversation.buyerId === user.uid;
    return {
      id: isBuyer ? activeConversation.sellerId : activeConversation.buyerId,
      name: isBuyer ? activeConversation.sellerName : activeConversation.buyerName,
      avatar: isBuyer ? activeConversation.sellerAvatar : activeConversation.buyerAvatar,
    };
  }, [activeConversation, user]);

  const openMessageCenter = () => setIsOpen(true);
  const closeMessageCenter = () => setIsOpen(false);
  const openConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsOpen(true);
  };

  const value: MessageCenterContextValue = {
    openMessageCenter,
    closeMessageCenter,
    openConversation,
  };

  return (
    <MessageCenterContext.Provider value={value}>
      {children}

      <div className="fixed bottom-6 right-6 z-50" ref={panelRef}>
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-[22rem] sm:w-[24rem] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              {activeConversation ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label={t.common?.back || "Volver"}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {otherUser?.name || t.nav?.user || "Usuario"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {activeConversation.auctionTitle}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-white text-sm font-semibold">
                    {t.messages?.title || "Mensajes"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.messages?.subtitle || "Conversaciones sobre subastas"}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-1">
                {activeConversation && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowReport(true)}
                    className="text-xs"
                  >
                    {t.messages?.report || "Reportar"}
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label={t.common?.cancel || "Cerrar"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {!user ? (
                <div className="p-6 text-center">
                  <p className="text-slate-400 text-sm mb-4">
                    {t.messages?.mustLogin || "Inicia sesión para chatear"}
                  </p>
                  <Link href="/login">
                    <Button size="sm">{t.nav?.login || "Iniciar sesión"}</Button>
                  </Link>
                </div>
              ) : activeConversation ? (
                <div className="p-4 space-y-3">
                  {loadingConversation ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      {t.messages?.emptyConversation || "Aún no hay mensajes"}
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[75%] ${isMine ? "text-right" : "text-left"}`}>
                            <div
                              className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                                isMine
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-200"
                              }`}
                            >
                              {msg.text}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {formatTime(msg.createdAt, locale)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      {t.messages?.empty || "Aún no tienes conversaciones"}
                    </p>
                  ) : (
                    conversations.map((conv) => {
                      const isBuyer = conv.buyerId === user?.uid;
                      const otherName = isBuyer ? conv.sellerName : conv.buyerName;
                      const otherAvatar = isBuyer ? conv.sellerAvatar : conv.buyerAvatar;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversationId(conv.id)}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-800/60 transition-colors flex items-start gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
                            {otherAvatar ? (
                              <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold">
                                {otherName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm text-white font-semibold">
                                {otherName || t.nav?.user || "Usuario"}
                              </p>
                              <span className="text-xs text-slate-500">
                                {conv.lastMessageAt
                                  ? formatTime(conv.lastMessageAt, locale)
                                  : ""}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {conv.auctionTitle}
                            </p>
                            {conv.lastMessage && (
                              <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                                {conv.lastMessage}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {user && activeConversation && (
              <form onSubmit={handleSend} className="border-t border-slate-800 p-3 flex gap-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t.messages?.placeholder || "Escribe un mensaje..."}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <Button type="submit" size="sm" isLoading={sending}>
                  {t.messages?.send || "Enviar"}
                </Button>
              </form>
            )}
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl flex items-center justify-center"
          aria-label={t.messages?.open || "Abrir mensajes"}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      <ReportUserModal
        isOpen={showReport}
        userName={otherUser?.name}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
        isSubmitting={reporting}
      />
    </MessageCenterContext.Provider>
  );
}

export function useMessageCenter(): MessageCenterContextValue {
  const context = useContext(MessageCenterContext);
  if (!context) {
    throw new Error("useMessageCenter must be used within a MessageCenterProvider");
  }
  return context;
}