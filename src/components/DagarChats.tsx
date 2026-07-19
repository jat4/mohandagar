import React, { useState, useEffect, useRef } from "react";
import { Chat, Message, UserProfile } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToUserChats,
  subscribeToMessages,
  sendMessage,
  getOrCreateChat,
  searchUsers,
  deleteMessage,
  deleteChat,
  markChatAsSeen
} from "../services/dbService";
import UsernameWithBadge from "./UsernameWithBadge";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, Search, User, ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";

interface DagarChatsProps {
  initialTargetUserId?: string | null; // Optional target to start chat with directly
  onUserProfileClick: (userId: string) => void;
}

export default function DagarChats({ initialTargetUserId, onUserProfileClick }: DagarChatsProps) {
  const { profile: myProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [tempActiveChat, setTempActiveChat] = useState<Chat | null>(null);

  const activeChat = (activeChatId ? chats.find((c) => c.id === activeChatId) : null) || tempActiveChat;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  // Mark chat as seen when active chat ID or message length changes (avoids infinite loops)
  useEffect(() => {
    if (activeChat && myProfile) {
      markChatAsSeen(activeChat.id, myProfile.uid);
    }
  }, [activeChat?.id, messages.length, myProfile?.uid]);

  // Search user state to start a chat
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const formatMessageTimeIST = (createdAt: any) => {
    if (!createdAt) return "";
    const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date.getTime())) return "";

    try {
      return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (err) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    }
  };

  const wasMessageSeen = (msgCreatedAt: any) => {
    if (!msgCreatedAt || !activeChat || !activeChat.seenBy) return false;
    const otherUserId = activeChat.participants.find(p => p !== myProfile?.uid);
    if (!otherUserId) return false;
    const otherSeenVal = activeChat.seenBy[otherUserId];
    if (!otherSeenVal) return false;

    const seenTime = new Date(otherSeenVal).getTime();
    const msgTime = typeof msgCreatedAt === "string" ? new Date(msgCreatedAt).getTime() : msgCreatedAt.toDate ? msgCreatedAt.toDate().getTime() : new Date(msgCreatedAt).getTime();
    
    return seenTime >= msgTime;
  };

  // 1. Subscribe to active chat threads
  useEffect(() => {
    if (!myProfile) return;
    const unsubscribe = subscribeToUserChats(myProfile.uid, (loadedChats) => {
      setChats(loadedChats);

      // Handle initial target chat redirect
      if (initialTargetUserId) {
        const existing = loadedChats.find((c) => c.participants.includes(initialTargetUserId));
        if (existing) {
          setActiveChatId(existing.id);
          setTempActiveChat(null);
        } else {
          // Trigger getOrCreateChat manually
          setupDirectChat(initialTargetUserId);
        }
      }
    });

    return () => unsubscribe();
  }, [myProfile, initialTargetUserId]);

  // 2. Subscribe to messages inside the active chat
  useEffect(() => {
    if (!activeChatId) {
      localStorage.removeItem("dagar_current_active_chat_id");
      setMessages([]);
      return;
    }
    localStorage.setItem("dagar_current_active_chat_id", activeChatId);
    const unsubscribe = subscribeToMessages(activeChatId, (loadedMessages) => {
      let finalMessages = loadedMessages;
      if (myProfile && activeChat?.deletedAt && activeChat.deletedAt[myProfile.uid]) {
        const deletedTime = new Date(activeChat.deletedAt[myProfile.uid]).getTime();
        finalMessages = loadedMessages.filter((m) => {
          if (!m.createdAt) return true; // Keep newly sent unsaved messages
          const msgTime = m.createdAt.seconds
            ? m.createdAt.seconds * 1000
            : new Date(m.createdAt).getTime();
          return msgTime > deletedTime;
        });
      }
      setMessages(finalMessages);
      // Mark as read in local storage
      localStorage.setItem(`dagar_chat_last_seen_${activeChatId}`, new Date().toISOString());
      window.dispatchEvent(new Event("dagar_chats_read_update"));
    });
    return () => {
      unsubscribe();
      localStorage.removeItem("dagar_current_active_chat_id");
      window.dispatchEvent(new Event("dagar_chats_read_update"));
    };
  }, [activeChatId, activeChat?.deletedAt?.[myProfile?.uid || ""], myProfile]);

  // General unmount cleanup for active chat tracking
  useEffect(() => {
    return () => {
      localStorage.removeItem("dagar_current_active_chat_id");
      window.dispatchEvent(new Event("dagar_chats_read_update"));
    };
  }, []);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle setting up a new direct chat
  const setupDirectChat = async (targetUserId: string) => {
    if (!myProfile) return;
    try {
      const chatId = await getOrCreateChat(myProfile.uid, targetUserId);
      // Wait a moment for subscription or find it
      const targetChat: Partial<Chat> = {
        id: chatId,
        participants: [myProfile.uid, targetUserId],
      };
      // Fetch target user profile dynamically
      const { getUserProfile } = await import("../services/dbService");
      const targetUser = await getUserProfile(targetUserId);
      if (targetUser) {
        targetChat.otherUser = targetUser;
      }
      setActiveChatId(chatId);
      setTempActiveChat(targetChat as Chat);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to setup chat thread", err);
    }
  };

  // Search users callback
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        // Exclude self from messaging search
        const filtered = results.filter((r) => r.uid !== myProfile?.uid);
        setSearchResults(filtered);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, myProfile]);

  const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!myProfile || !activeChat || !messageInput.trim()) return;

    const recipientId = activeChat.participants.find((p) => p !== myProfile.uid);
    if (!recipientId) return;

    const txt = messageInput.trim();
    setMessageInput("");

    try {
      await sendMessage(activeChat.id, myProfile.uid, recipientId, txt);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex-1 bg-black text-white flex h-[calc(100vh-64px)] overflow-hidden select-none">
      {/* Sidebar: Chats List */}
      <div
        className={`w-full md:w-[350px] border-r border-gray-800 bg-black flex flex-col ${
          activeChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Chat Header Search */}
        <div className="p-4 border-b border-gray-900 bg-black space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h1 className="text-lg font-bold tracking-tight">Mohan Dagar Direct</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search chat recipient handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Chats Threads Viewport */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-black">
          {searchQuery.trim().length > 0 ? (
            /* Search results view */
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 mb-1.5">
                Start New Chat
              </p>
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No results for "{searchQuery}"</p>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => setupDirectChat(user.uid)}
                    className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  >
                    <img
                      src={user.photoURL}
                      alt={user.username}
                      className="w-9 h-9 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">
                        <UsernameWithBadge userId={user.uid} username={user.username} />
                      </div>
                      <p className="text-[10px] text-gray-400">{user.fullName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Standard chats threads list */
            <>
              {chats.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-2">
                  <MessageSquare className="w-8 h-8 text-gray-750 mx-auto" />
                  <p className="text-xs text-gray-500 font-bold">No Chats Yet</p>
                  <p className="text-[10px] text-gray-600">Type a username in search bar to start chatting!</p>
                </div>
              ) : (
                chats.map((chat) => {
                  const otherUser = chat.otherUser;
                  if (!otherUser) return null;
                  const isActive = activeChat?.id === chat.id;

                  const parseSafeDate = (val: any): Date | null => {
                    if (!val) return null;
                    if (val instanceof Date) return val;
                    if (typeof val.toDate === "function") {
                      try {
                        return val.toDate();
                      } catch (e) {
                        // ignore
                      }
                    }
                    if (val.seconds !== undefined) {
                      return new Date(val.seconds * 1000);
                    }
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? null : d;
                  };

                  // Check if unread
                  let isUnread = false;
                  const isMyMessage = chat.lastSenderId === myProfile?.uid;
                  if (!isMyMessage && chat.lastMessage && chat.lastMessage !== "Conversation started" && !isActive) {
                    const lastSeen = localStorage.getItem(`dagar_chat_last_seen_${chat.id}`);
                    if (!lastSeen) {
                      isUnread = true;
                    } else {
                      const lastSeenDate = new Date(lastSeen);
                      if (isNaN(lastSeenDate.getTime())) {
                        isUnread = true;
                      } else {
                        const lastMsgTime = parseSafeDate(chat.lastMessageTime) || parseSafeDate(chat.updatedAt) || new Date();
                        if (lastMsgTime.getTime() > lastSeenDate.getTime() + 1000) { // matching 1-second grace margin
                          isUnread = true;
                        }
                      }
                    }
                  }

                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setTempActiveChat(null);
                        setSearchQuery("");
                        // Mark as read in local storage
                        localStorage.setItem(`dagar_chat_last_seen_${chat.id}`, new Date().toISOString());
                        window.dispatchEvent(new Event("dagar_chats_read_update"));
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group ${
                        isActive
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <img
                        src={otherUser.photoURL}
                        alt={otherUser.username}
                        className="w-11 h-11 rounded-full object-cover border border-gray-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <div className={`text-xs font-bold truncate inline-block ${isUnread ? "text-white font-extrabold" : "text-gray-300"}`}>
                            <UsernameWithBadge userId={otherUser.uid} username={otherUser.username} />
                          </div>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isUnread ? "text-white font-semibold" : "text-gray-400"}`}>{chat.lastMessage}</p>
                      </div>

                      {/* Delete Conversation action inline */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {deletingChatId === chat.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  if (myProfile) {
                                    await deleteChat(chat.id, myProfile.uid);
                                  }
                                  if (activeChatId === chat.id) {
                                    setActiveChatId(null);
                                    setTempActiveChat(null);
                                  }
                                  setDeletingChatId(null);
                                } catch (err) {
                                  console.error("Failed to delete chat thread", err);
                                }
                              }}
                              className="text-[9px] font-bold text-red-500 bg-red-950/40 border border-red-900/50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-red-950 transition-all"
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingChatId(null);
                              }}
                              className="text-[9px] font-bold text-gray-400 bg-neutral-900 border border-gray-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-neutral-800 transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingChatId(chat.id);
                            }}
                            className="p-1 rounded-md text-gray-500 hover:text-red-500 hover:bg-white/5 transition-all cursor-pointer md:opacity-0 md:group-hover:opacity-100"
                            title="Delete Conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isUnread && deletingChatId !== chat.id && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Viewport: Conversation Messages Box */}
      <div className={`flex-1 flex flex-col bg-black h-full ${!activeChat ? "hidden md:flex" : "flex"}`}>
        {activeChat ? (
          <>
            {/* Conversation recipient header */}
            <div className="px-6 py-4 border-b border-gray-900 bg-black flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setActiveChatId(null);
                  setTempActiveChat(null);
                }}
                className="md:hidden p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white mr-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <img
                src={activeChat.otherUser?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=MohanDagar"}
                alt={activeChat.otherUser?.username || "Recipient"}
                className="w-9 h-9 rounded-full object-cover border border-gray-800 cursor-pointer hover:opacity-85"
                onClick={() => activeChat.otherUser?.uid && onUserProfileClick(activeChat.otherUser.uid)}
                referrerPolicy="no-referrer"
              />

              <div className="text-left flex-1">
                <div
                  onClick={() => activeChat.otherUser?.uid && onUserProfileClick(activeChat.otherUser.uid)}
                  className="text-sm font-bold text-white cursor-pointer hover:text-gray-300 transition-colors inline-block"
                >
                  <UsernameWithBadge userId={activeChat.otherUser?.uid || ""} username={activeChat.otherUser?.username || "User"} />
                </div>
                <p className="text-[10px] text-gray-500">
                  {activeChat.otherUser?.fullName || "Active Chat Participant"}
                </p>
              </div>
            </div>

            {/* Scrollable bubble messages list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === myProfile?.uid;
                const isLastMsg = index === messages.length - 1;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"} mb-2`}>
                    <div className={`flex items-end gap-2.5 max-w-[85%] group ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Recipient Profile Photo next to message bubble */}
                      {!isMine && (
                        <img
                          src={activeChat.otherUser?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=MohanDagar"}
                          alt="User"
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-800 self-end mb-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => activeChat.otherUser?.uid && onUserProfileClick(activeChat.otherUser.uid)}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {/* Bubble container */}
                      <div
                        className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-left shadow-md break-words whitespace-pre-wrap ${
                          isMine
                            ? "bg-white text-black font-normal rounded-br-sm"
                            : "bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Delete/Unsend action button */}
                      {isMine && (
                        <button
                          onClick={async () => {
                            if (confirm("Do you want to unsend this message?")) {
                              if (activeChat) {
                                await deleteMessage(activeChat.id, msg.id);
                              }
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 hover:bg-neutral-900 rounded-full text-neutral-500 hover:text-red-500 transition-all cursor-pointer self-center shrink-0"
                          title="Unsend Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Meta details (Time & Seen status) */}
                    <div className={`flex items-center gap-1.5 text-[9px] text-gray-500 mt-1 ${isMine ? "mr-1 justify-end" : "ml-9.5 justify-start"} select-none`}>
                      <span>{formatMessageTimeIST(msg.createdAt)}</span>
                      {isMine && isLastMsg && wasMessageSeen(msg.createdAt) && (
                        <>
                          <span className="text-[8px] text-gray-600">•</span>
                          <span className="font-semibold text-neutral-400 animate-fade-in">Seen</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Form input dispatch bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-900 bg-black shrink-0">
              <div className="flex items-end gap-2 bg-neutral-900 border border-gray-800 rounded-xl p-2 focus-within:border-white transition-all">
                <textarea
                  placeholder="Message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={Math.min(4, messageInput.split("\n").length || 1)}
                  className="flex-1 bg-transparent border-0 px-2.5 py-2 text-sm text-white focus:outline-none focus:ring-0 resize-none min-h-[36px] max-h-[120px] placeholder:text-gray-500 leading-normal scrollbar-thin"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-white hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white text-black font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-lg shrink-0 self-end"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty Chat Viewport Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-black">
            <div className="p-4 rounded-lg bg-neutral-900 border border-gray-800">
              <MessageSquare className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-white">Your Premium Inbox</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Click on any existing conversation, or enter a username handle on the search sidebar to launch a chat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
