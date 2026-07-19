import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import HomeFeed from "./components/HomeFeed";
import SearchExplore from "./components/SearchExplore";
import CreatePost from "./components/CreatePost";
import DagarChats from "./components/DagarChats";
import UserProfileView from "./components/UserProfileView";
import NotificationsPanel from "./components/NotificationsPanel";
import SettingsView from "./components/SettingsView";
import AdminPanel from "./components/AdminPanel";
import { subscribeToNotifications, subscribeToUserChats } from "./services/dbService";
import { Chat } from "./types";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
  Sparkles,
  ChevronLeft,
  Bell,
  Settings,
  Shield
} from "lucide-react";

type Tab = "home" | "search" | "chats" | "profile" | "notifications" | "settings" | "admin";

function DashboardLayout() {
  const { profile, isLocalDemoMode } = useAuth();
  const [dismissBanner, setDismissBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<"post" | "story">("post");

  // Chat direct messaging trigger helper
  const [chatDirectUserId, setChatDirectUserId] = useState<string | null>(null);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToNotifications(profile.uid, (notifs) => {
      const count = notifs.filter((n) => !n.read).length;
      setUnreadNotificationsCount(count);
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;

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

    const checkUnreadChats = (loadedChats: Chat[]) => {
      let unreadCount = 0;
      const currentActiveChatId = localStorage.getItem("dagar_current_active_chat_id");

      loadedChats.forEach((chat) => {
        if (!chat.id) return;

        // If it's the currently active chat, it's not unread, and we should keep updating its lastSeen
        if (currentActiveChatId === chat.id) {
          localStorage.setItem(`dagar_chat_last_seen_${chat.id}`, new Date().toISOString());
          return;
        }

        const isMyMessage = chat.lastSenderId === profile.uid;
        if (!isMyMessage && chat.lastMessage && chat.lastMessage !== "Conversation started") {
          const lastSeen = localStorage.getItem(`dagar_chat_last_seen_${chat.id}`);
          if (!lastSeen) {
            unreadCount++;
          } else {
            const lastSeenDate = new Date(lastSeen);
            if (isNaN(lastSeenDate.getTime())) {
              unreadCount++;
            } else {
              const lastMsgTime = parseSafeDate(chat.lastMessageTime) || parseSafeDate(chat.updatedAt) || new Date();
              if (lastMsgTime.getTime() > lastSeenDate.getTime() + 1000) { // added a 1-second grace margin to avoid race conditions
                unreadCount++;
              }
            }
          }
        }
      });
      setUnreadMessagesCount(unreadCount);
    };

    let cachedChats: Chat[] = [];
    const unsubscribe = subscribeToUserChats(profile.uid, (loadedChats) => {
      cachedChats = loadedChats;
      checkUnreadChats(loadedChats);
    });

    const handleReadUpdate = () => {
      checkUnreadChats(cachedChats);
    };

    window.addEventListener("dagar_chats_read_update", handleReadUpdate);
    window.addEventListener("dagar_chats_db_update", handleReadUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("dagar_chats_read_update", handleReadUpdate);
      window.removeEventListener("dagar_chats_db_update", handleReadUpdate);
    };
  }, [profile?.uid]);

  const handleUserProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab("profile");
  };

  const handleOpenDirectChat = (targetUserId: string) => {
    setChatDirectUserId(targetUserId);
    setSelectedUserId(null); // clear profile search
    setActiveTab("chats");
  };

  const handleAddStoryClick = () => {
    setCreateDefaultType("story");
    setIsCreateOpen(true);
  };

  const handleAddPostClick = () => {
    setCreateDefaultType("post");
    setIsCreateOpen(true);
  };

  const handleBackToFeed = () => {
    setSelectedUserId(null);
    setActiveTab("home");
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col md:flex-row select-none overflow-hidden">
      {/* LEFT NAVIGATION SIDEBAR (Desktop only) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-black px-4 py-8 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div className="px-3 py-2">
            <h1 className="text-2xl font-black tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-gray-400">
              Mohan Dagar
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab("home");
                setSelectedUserId(null);
                setChatDirectUserId(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "home" && !selectedUserId
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Home className="w-5 h-5" />
              Home
            </button>

            <button
              onClick={() => {
                setActiveTab("search");
                setSelectedUserId(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "search" && !selectedUserId
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Search className="w-5 h-5" />
              Search
            </button>

            <button
              onClick={handleAddPostClick}
              className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              Create
            </button>

            <button
              onClick={() => {
                setActiveTab("chats");
                setSelectedUserId(null);
                setChatDirectUserId(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "chats"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </div>
              {unreadMessagesCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("notifications");
                setSelectedUserId(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "notifications" && !selectedUserId
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setSelectedUserId(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "profile" && !selectedUserId
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <User className="w-5 h-5" />
              Profile
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setSelectedUserId(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "settings" && !selectedUserId
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>

            {profile?.username === "admin" && (
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setSelectedUserId(null);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer border border-red-500/15 ${
                  activeTab === "admin" && !selectedUserId
                    ? "bg-red-500/10 text-red-300 border-red-500/25"
                    : "text-red-400 hover:bg-red-500/5 hover:text-red-300"
                }`}
              >
                <Shield className="w-5 h-5" />
                Admin Console
              </button>
            )}
          </nav>
        </div>

        {/* User Mini Card */}
        {profile && (
          <div
            onClick={() => {
              setActiveTab("profile");
              setSelectedUserId(null);
            }}
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent"
          >
            <img
              src={profile.photoURL}
              alt={profile.username}
              className="w-10 h-10 rounded-full border border-gray-800 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-white truncate max-w-[100px]">@{profile.username}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{profile.fullName}</p>
            </div>
          </div>
        )}
      </aside>

      {/* TOP HEADER (Mobile only) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-900 bg-black shrink-0">
        <div className="flex items-center gap-2">
          {selectedUserId && (
            <button
              onClick={() => setSelectedUserId(null)}
              className="p-1 hover:bg-white/5 rounded-full text-gray-400 mr-1 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span className="font-sans font-bold text-xl tracking-tight italic text-white">
            Mohan Dagar
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setActiveTab("notifications");
              setSelectedUserId(null);
            }}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={handleAddPostClick}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* CORE CONTENTS FEED */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        {isLocalDemoMode && !dismissBanner && (
          <div className="bg-neutral-900 border-b border-gray-800 text-xs px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white shrink-0" />
              <span className="text-gray-300">
                Running in <strong className="text-white">Local Demo Mode</strong> because Firebase Auth is not configured. All features (feed, chat, stories, comments) are fully operational and saved locally!
              </span>
            </div>
            <button
              onClick={() => setDismissBanner(true)}
              className="text-gray-500 hover:text-white px-2 cursor-pointer font-bold text-sm"
              aria-label="Dismiss banner"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {selectedUserId ? (
              <motion.div
                key={`profile-${selectedUserId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full bg-black"
              >
                <UserProfileView
                  profileId={selectedUserId}
                  onBackToFeed={handleBackToFeed}
                  onOpenDirectChat={handleOpenDirectChat}
                  onUserProfileClick={handleUserProfileClick}
                  onOpenSettings={() => {
                    setSelectedUserId(null);
                    setActiveTab("settings");
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full bg-black"
              >
                {activeTab === "home" && (
                  <HomeFeed
                    onUserProfileClick={handleUserProfileClick}
                    onAddStoryClick={handleAddStoryClick}
                    onOpenDirectChat={handleOpenDirectChat}
                  />
                )}
                {activeTab === "search" && (
                  <SearchExplore onUserProfileClick={handleUserProfileClick} />
                )}
                {activeTab === "chats" && (
                  <DagarChats
                    initialTargetUserId={chatDirectUserId}
                    onUserProfileClick={handleUserProfileClick}
                  />
                )}
                {activeTab === "profile" && (
                  <UserProfileView
                    onBackToFeed={handleBackToFeed}
                    onOpenDirectChat={handleOpenDirectChat}
                    onUserProfileClick={handleUserProfileClick}
                    onOpenSettings={() => setActiveTab("settings")}
                  />
                )}
                {activeTab === "notifications" && (
                  <NotificationsPanel />
                )}
                {activeTab === "settings" && (
                  <SettingsView onBackToFeed={handleBackToFeed} />
                )}
                {activeTab === "admin" && (
                  <AdminPanel />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR (Mobile only) */}
      <nav className="md:hidden flex justify-around items-center border-t border-gray-950 bg-black py-2.5 shrink-0 z-30">
        <button
          onClick={() => {
            setActiveTab("home");
            setSelectedUserId(null);
            setChatDirectUserId(null);
          }}
          className={`p-2 transition-colors cursor-pointer ${
            activeTab === "home" && !selectedUserId ? "text-white" : "text-gray-500"
          }`}
        >
          <Home className="w-5.5 h-5.5" />
        </button>

        <button
          onClick={() => {
            setActiveTab("search");
            setSelectedUserId(null);
          }}
          className={`p-2 transition-colors cursor-pointer ${
            activeTab === "search" && !selectedUserId ? "text-white" : "text-gray-500"
          }`}
        >
          <Search className="w-5.5 h-5.5" />
        </button>

        <button
          onClick={() => {
            setActiveTab("chats");
            setSelectedUserId(null);
            setChatDirectUserId(null);
          }}
          className={`p-2 transition-colors cursor-pointer relative ${
            activeTab === "chats" ? "text-white" : "text-gray-500"
          }`}
        >
          <MessageSquare className="w-5.5 h-5.5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("notifications");
            setSelectedUserId(null);
          }}
          className={`p-2 transition-colors cursor-pointer relative ${
            activeTab === "notifications" ? "text-white" : "text-gray-500"
          }`}
        >
          <Bell className="w-5.5 h-5.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {profile?.username === "admin" && (
          <button
            onClick={() => {
              setActiveTab("admin");
              setSelectedUserId(null);
            }}
            className={`p-2 transition-colors cursor-pointer ${
              activeTab === "admin" ? "text-red-400" : "text-gray-500"
            }`}
          >
            <Shield className="w-5.5 h-5.5" />
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab("profile");
            setSelectedUserId(null);
          }}
          className={`p-2 transition-colors cursor-pointer ${
            activeTab === "profile" && !selectedUserId ? "text-white" : "text-gray-500"
          }`}
        >
          {profile ? (
            <img
              src={profile.photoURL}
              alt="My Avatar"
              className={`w-6 h-6 rounded-full border object-cover ${
                activeTab === "profile" && !selectedUserId ? "border-white" : "border-gray-700"
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-5.5 h-5.5" />
          )}
        </button>
      </nav>

      {/* Overlay Create Modal popup */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreatePost
            defaultType={createDefaultType}
            onClose={() => setIsCreateOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MainApp() {
  const { user, profile, loading, usernameNeeded } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full"
        />
        <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase animate-pulse">
          Synchronizing Mohan Dagar...
        </span>
      </div>
    );
  }

  // If user is not authenticated or needs username setup, display Auth Screen
  if (!user || usernameNeeded || !profile) {
    return <AuthScreen />;
  }

  return <DashboardLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
