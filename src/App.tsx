import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  NavLink
} from "react-router-dom";
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
import PostDetailView from "./components/PostDetailView";
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
  Shield,
  WifiOff,
  AlertOctagon,
  RefreshCw,
  HelpCircle,
  Info,
  ShieldCheck,
  FileText
} from "lucide-react";

// ==========================================
// 1. DYNAMIC METADATA & SEO UPDATER
// ==========================================
interface RouteMetaProps {
  title: string;
  description?: string;
}

function RouteMeta({ title, description }: RouteMetaProps) {
  useEffect(() => {
    document.title = `${title} • Mohan Dagar`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description || "Experience Mohan Dagar - The premium social network engine.");

    // Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", `${title} • Mohan Dagar`);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description || "Experience Mohan Dagar - The premium social network engine.");
  }, [title, description]);

  return null;
}

// ==========================================
// 2. ERROR BOUNDARY (500 PAGE)
// ==========================================
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SystemErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught exception caught by Error Boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-6 animate-pulse">
            <AlertOctagon className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Internal Engine Failure (500)</h1>
          <p className="text-gray-400 max-w-md text-xs leading-relaxed mb-6">
            A fatal exception was intercepted by the core compiler. Any unsaved data was safely cached.
          </p>
          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl max-w-lg w-full text-left font-mono text-[10px] text-red-400 overflow-x-auto mb-6">
            {this.state.error?.toString() || "Unknown compiler loop error"}
          </div>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-extrabold text-xs rounded-lg hover:bg-neutral-200 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reboot Core Environment
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// 3. OFFLINE STATUS DETECTOR & BANNER
// ==========================================
function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const pingOnline = () => setIsOnline(true);
    const pingOffline = () => setIsOnline(false);

    window.addEventListener("online", pingOnline);
    window.addEventListener("offline", pingOffline);

    return () => {
      window.removeEventListener("online", pingOnline);
      window.removeEventListener("offline", pingOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 inset-x-0 bg-red-650 border-b border-red-800 text-white text-xs py-2 px-4 flex items-center justify-center gap-2.5 z-50 shadow-lg font-bold"
        >
          <WifiOff className="w-4 h-4 text-red-100 animate-pulse" />
          <span>Offline Connection Mode. Database operations are cached locally and will sync when network is restored.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// 4. ROUTE SECURITY (AUTHENTICATED GUARDS)
// ==========================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, usernameNeeded } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase animate-pulse">
          Authenticating Session...
        </span>
      </div>
    );
  }

  if (!user || !profile) {
    // Keep target path to return to after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (usernameNeeded) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children, isSignUp = false }: { children?: React.ReactNode; isSignUp?: boolean }) {
  const { user, profile, usernameNeeded } = useAuth();
  const location = useLocation();

  if (user && profile && !usernameNeeded) {
    const fromPath = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={fromPath} replace />;
  }

  return <AuthScreen initialIsSignUp={isSignUp} />;
}

// ==========================================
// 5. MAIN ROUTED DASHBOARD LAYOUT
// ==========================================
function DashboardLayout() {
  const { profile, isLocalDemoMode } = useAuth();
  const [dismissBanner, setDismissBanner] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Monitor visual viewport height to stay stable with mobile keyboards
  const [viewportHeight, setViewportHeight] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 800);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);

    const preventScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("scroll", preventScroll, { passive: true });

    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      window.removeEventListener("scroll", preventScroll);
    };
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Sync Notifications unread count
  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToNotifications(profile.uid, (notifs) => {
      // Load user preferences
      const storedPrefs = localStorage.getItem(`dagar_notification_prefs_${profile.uid}`);
      let prefs = { likes: true, comments: true, mentions: true, tags: true, follows: true, messages: true, stories: true };
      if (storedPrefs) {
        try { prefs = JSON.parse(storedPrefs); } catch (e) {}
      }

      const filtered = notifs.filter((notif) => {
        const type = notif.type;
        if (!prefs.likes && (type === "like" || type === "like_reel")) return false;
        if (!prefs.comments && (type === "comment" || type === "comment_reel" || type === "reply_comment")) return false;
        if (!prefs.mentions && (type === "mention_comment" || type === "mention_caption" || type === "story_mention")) return false;
        if (!prefs.tags && (type === "tag_post" || type === "tag_reel")) return false;
        if (!prefs.follows && (type === "follow" || type === "follow_request" || type === "follow_request_accepted")) return false;
        if (!prefs.messages && (type === "message_request")) return false;
        if (!prefs.stories && (type === "story_like" || type === "story_mention")) return false;
        return true;
      });

      const count = filtered.filter((n) => !n.read).length;
      setUnreadNotificationsCount(count);
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  // Sync Messages unread count
  useEffect(() => {
    if (!profile?.uid) return;

    const parseSafeDate = (val: any): Date | null => {
      if (!val) return null;
      if (val instanceof Date) return val;
      if (typeof val.toDate === "function") {
        try {
          return val.toDate();
        } catch (e) {}
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
              if (lastMsgTime.getTime() > lastSeenDate.getTime() + 1000) {
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

  const handleCreateOpen = () => {
    setIsCreateOpen(true);
  };

  const menuItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Search", icon: Search },
    {
      to: "/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessagesCount
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotificationsCount
    },
    { to: `/${profile?.username}`, label: "Profile", icon: User },
    { to: "/settings/profile", label: "Settings", icon: Settings }
  ];

  return (
    <div
      style={isMobile ? { height: `${viewportHeight}px` } : { height: "100dvh" }}
      className="fixed inset-x-0 top-0 bg-black text-white flex flex-col md:flex-row select-none overflow-hidden pt-1"
    >
      {/* LEFT NAVIGATION SIDEBAR (Desktop only) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-900 bg-black px-4 py-8 justify-between shrink-0 select-none">
        <div className="space-y-8">
          {/* Logo */}
          <div className="px-3 py-2 text-left">
            <h1
              onClick={() => navigate("/")}
              className="text-2xl font-black tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-gray-400 cursor-pointer"
            >
              Mohan Dagar
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // Precise path checking for active style
              const isProfileRoute = profile ? item.to === `/${profile.username}` : false;
              const isSettingsRoute = item.to.startsWith("/settings");
              const isMessagesRoute = item.to.startsWith("/messages");

              let isActive = false;
              if (isProfileRoute) {
                isActive = profile ? location.pathname === `/${profile.username}` : false;
              } else if (isSettingsRoute) {
                isActive = location.pathname.startsWith("/settings");
              } else if (isMessagesRoute) {
                isActive = location.pathname.startsWith("/messages");
              } else {
                isActive = location.pathname === item.to;
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}

            {/* Create trigger link */}
            <button
              onClick={handleCreateOpen}
              className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              Create
            </button>

            {/* Admin Console Gate */}
            {profile?.username === "admin" && (
              <NavLink
                to="/admin-panel"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer border border-red-500/15 ${
                    isActive || location.pathname.startsWith("/admin-panel")
                      ? "bg-red-500/10 text-red-300 border-red-500/25"
                      : "text-red-400 hover:bg-red-500/5 hover:text-red-300"
                  }`
                }
              >
                <Shield className="w-5 h-5" />
                Admin Console
              </NavLink>
            )}
          </nav>
        </div>

        {/* User Mini profile button */}
        {profile && (
          <div
            onClick={() => navigate(`/${profile.username}`)}
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent"
          >
            <img
              src={profile.photoURL}
              alt={profile.username}
              className="w-10 h-10 rounded-full border border-gray-800 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-white truncate max-w-[100px]">{profile.username}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{profile.fullName}</p>
            </div>
          </div>
        )}
      </aside>

      {/* TOP HEADER (Mobile only) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-900 bg-black shrink-0">
        <div className="flex items-center gap-2">
          {location.pathname !== "/" && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-white/5 rounded-full text-gray-400 mr-1 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span
            onClick={() => navigate("/")}
            className="font-sans font-bold text-xl tracking-tight italic text-white cursor-pointer"
          >
            Mohan Dagar
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/notifications")}
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
            onClick={handleCreateOpen}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* CORE CONTENT ROUTER OUTLET */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        {isLocalDemoMode && !dismissBanner && (
          <div className="bg-neutral-900 border-b border-gray-800 text-xs px-4 py-2.5 flex items-center justify-between shrink-0 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white shrink-0" />
              <span className="text-gray-300">
                Running in <strong className="text-white">Local Demo Mode</strong> because Firebase Auth is not configured. All features (feed, chats, stories, comments) are fully operational and saved locally!
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
          <Routes>
            <Route path="" element={<HomeFeed />} />
            <Route path="explore" element={<SearchExplore />} />
            <Route path="search" element={<SearchExplore />} />
            <Route path="notifications" element={<NotificationsPanel />} />
            <Route path="messages" element={<DagarChats />} />
            <Route path="messages/:conversationId" element={<DagarChats />} />
            <Route path="settings" element={<Navigate to="/settings/profile" replace />} />
            <Route path="settings/:tab" element={<SettingsView />} />
            <Route path="admin-panel" element={<Navigate to="/admin-panel/users" replace />} />
            <Route path="admin-panel/:section" element={<AdminPanel />} />
            <Route path="post/:postId" element={<PostDetailView />} />
            <Route path="post/:postId/comments" element={<PostDetailView />} />
            <Route path="post/:postId/likes" element={<PostDetailView />} />
            <Route path=":username" element={<UserProfileView />} />
            <Route path=":username/followers" element={<UserProfileView />} />
            <Route path=":username/following" element={<UserProfileView />} />
            <Route path=":username/media" element={<UserProfileView />} />
            <Route path=":username/tagged" element={<UserProfileView />} />

            {/* Static pages */}
            <Route path="about" element={<AboutPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="help" element={<HelpPage />} />

            {/* Unmatched protected page fallback */}
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </div>
      </main>

      {/* BOTTOM MOBILE NAVIGATION BAR */}
      <nav className="md:hidden flex justify-around items-center border-t border-gray-950 bg-black py-2.5 shrink-0 z-30">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isProfileRoute = profile ? item.to === `/${profile.username}` : false;
          const isMessagesRoute = item.to.startsWith("/messages");

          let isActive = false;
          if (isProfileRoute) {
            isActive = profile ? location.pathname === `/${profile.username}` : false;
          } else if (isMessagesRoute) {
            isActive = location.pathname.startsWith("/messages");
          } else {
            isActive = location.pathname === item.to;
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`p-2 transition-colors cursor-pointer relative ${
                isActive ? "text-white" : "text-gray-500"
              }`}
            >
              {isProfileRoute && profile ? (
                <img
                  src={profile.photoURL}
                  alt="My Avatar"
                  className={`w-6 h-6 rounded-full border object-cover ${
                    isActive ? "border-white" : "border-gray-700"
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon className="w-5.5 h-5.5" />
              )}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
        {profile?.username === "admin" && (
          <NavLink
            to="/admin-panel"
            className={({ isActive }) =>
              `p-2 transition-colors cursor-pointer ${isActive ? "text-red-400" : "text-gray-500"}`
            }
          >
            <Shield className="w-5.5 h-5.5" />
          </NavLink>
        )}
      </nav>

      {/* Overlay Create Modal popup */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreatePost
            defaultType="post"
            onClose={() => setIsCreateOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 6. BEAUTIFUL STATIC POLICY/INFO PAGES
// ==========================================
function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 text-left bg-black text-white min-h-screen">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-gray-400 hover:text-white font-bold text-xs">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-2 text-white">
          <Info className="w-8 h-8 text-purple-400" />
          About Mohan Dagar
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          Mohan Dagar is a boutique, next-generation social medium platform built for visual exploration and conversational intimacy. Our server blends ultra-fast reactive UI elements, immersive full-screen media assets, and real-time private threads.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Designed and engineered using pristine Tailwind typography guidelines, we completely bypass typical cluttered feeds to provide an eye-safe, zero-distraction sanctuary where users can enjoy sharing experiences.
        </p>
      </div>
    </div>
  );
}

function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 text-left bg-black text-white min-h-screen">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-gray-400 hover:text-white font-bold text-xs">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-2 text-white">
          <FileText className="w-8 h-8 text-blue-400" />
          Terms of Service
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          By registering an account on Mohan Dagar, you agree to respect our community guidelines. Users are solely responsible for all images, captions, and comments posted under their verified handle.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          We strictly prohibit scam activity, spam links, copyright violation, and harassing language inside private threads. Accounts violating these instructions are subject to administrative suspension or permanent deletion by the superuser console.
        </p>
      </div>
    </div>
  );
}

function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 text-left bg-black text-white min-h-screen">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-gray-400 hover:text-white font-bold text-xs">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-2 text-white">
          <ShieldCheck className="w-8 h-8 text-green-400" />
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed">
          Your privacy is our utmost priority. All chat threads are secure, and your list of blocked accounts is strictly confidential.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          We do not sell, trade, or monetize your activity logs. If you configure your account visibility to "Private", only followers approved by you can access your shared media feed.
        </p>
      </div>
    </div>
  );
}

function HelpPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 text-left bg-black text-white min-h-screen">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-gray-400 hover:text-white font-bold text-xs">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-2 text-white">
          <HelpCircle className="w-8 h-8 text-yellow-400" />
          Help & Support Center
        </h1>
        <p className="text-xs text-gray-300 font-bold">Frequently Asked Questions:</p>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-white">How do I obtain the Verified Blue Badge?</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">The superuser @admin reviews accounts periodically. Verified accounts display the blue tick badge.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">How does Local Demo Mode work?</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">If Firebase services are unavailable, all data acts locally inside your browser's persistent cache so you can enjoy full-stack features with zero disruption.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. FUTURISTIC 404 NOT FOUND VIEW
// ==========================================
function NotFoundView() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black min-h-screen text-white select-none">
      <div className="bg-neutral-900 border border-gray-800 p-4 rounded-full mb-6 relative">
        <AlertOctagon className="w-12 h-12 text-yellow-500 animate-pulse" />
      </div>
      <h1 className="text-4xl font-black tracking-tight mb-2">Route Lost (404)</h1>
      <p className="text-gray-400 max-w-sm text-xs leading-relaxed mb-8">
        The coordinate you requested does not map to any active modules in the Mohan Dagar ecosystem.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2.5 bg-white text-black font-extrabold text-xs rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
      >
        Return to Home Feed
      </button>
    </div>
  );
}

// ==========================================
// 8. ROUTE ARCHITECTURE CONSOLE WRAPPER
// ==========================================
function MainApp() {
  return (
    <SystemErrorBoundary>
      <OfflineDetector />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<AuthRoute isSignUp={false} />} />
        <Route path="/register" element={<AuthRoute isSignUp={true} />} />

        {/* Protected Dashboard Layout and children */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </SystemErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
