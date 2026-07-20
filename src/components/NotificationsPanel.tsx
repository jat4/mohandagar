import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  subscribeToFollowing,
  followUser,
  addNotification,
  checkPostExists,
  deleteNotification
} from "../services/dbService";
import { AppNotification } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageSquare,
  UserPlus,
  UserCheck,
  CheckCircle,
  Bell,
  Sparkles,
  Info,
  Sliders,
  ChevronRight,
  Eye,
  Trash2,
  X,
  Play,
  PlayCircle,
  MessageCircle,
  AtSign,
  Video,
  Clock,
  Shield,
  AlertTriangle
} from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";

export default function NotificationsPanel() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [showSimulateConsole, setShowSimulateConsole] = useState(false);
  const [prefs, setPrefs] = useState({
    likes: true,
    comments: true,
    mentions: true,
    tags: true,
    follows: true,
    messages: true,
    stories: true
  });

  // Story Lightbox State
  const [activeStory, setActiveStory] = useState<{
    username: string;
    photoURL: string;
    imageURL: string;
  } | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Load preferences
  useEffect(() => {
    if (!profile?.uid) return;
    const stored = localStorage.getItem(`dagar_notification_prefs_${profile.uid}`);
    if (stored) {
      try {
        setPrefs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse preferences:", e);
      }
    }
  }, [profile?.uid]);

  // Load notifications and following
  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribeNotifs = subscribeToNotifications(profile.uid, (notifs) => {
      setNotifications(notifs);
    });

    const unsubscribeFollowing = subscribeToFollowing(profile.uid, (ids) => {
      setFollowingIds(ids);
    });

    return () => {
      unsubscribeNotifs();
      unsubscribeFollowing();
    };
  }, [profile?.uid]);

  // Automatic cleanup of notifications for deleted related posts
  useEffect(() => {
    if (!profile?.uid || notifications.length === 0) return;

    const verifyAndCleanup = async () => {
      for (const notif of notifications) {
        if (notif.postId) {
          try {
            const exists = await checkPostExists(notif.postId);
            if (!exists) {
              await deleteNotification(profile.uid, notif.id);
            }
          } catch (err) {
            console.error("Failed to check or delete notification related to post:", err);
          }
        }
      }
    };

    // Run clean up
    verifyAndCleanup();
  }, [notifications.length, profile?.uid]);

  // Story Auto-Advance Timer
  useEffect(() => {
    if (!activeStory) return;
    setStoryProgress(0);

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          setActiveStory(null);
          return 0;
        }
        return prev + 1; // updates every 40ms, total 4 seconds
      });
    }, 40);

    return () => clearInterval(interval);
  }, [activeStory]);

  const handleMarkAsRead = async (id: string) => {
    if (!profile?.uid) return;
    try {
      await markNotificationAsRead(profile.uid, id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile?.uid) return;
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => markNotificationAsRead(profile.uid, n.id)));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleFollowBack = async (targetUserId: string, targetUsername: string) => {
    if (!profile?.uid) return;
    try {
      await followUser(profile.uid, targetUserId);
      await addNotification(targetUserId, {
        userId: targetUserId,
        type: "follow",
        title: "New Follower!",
        message: `@${profile.username} started following you back.`,
        read: false,
        senderId: profile.uid,
        senderUsername: profile.username,
        senderPhotoURL: profile.photoURL || ""
      });
    } catch (err) {
      console.error("Failed to follow user back:", err);
    }
  };

  // Filter notifications based on preferences
  const filteredNotifs = notifications.filter((notif) => {
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

  // Split priority and grouped notifications
  const priorityNotifications = filteredNotifs.filter((n) => n.isPriority);
  const generalNotifications = filteredNotifs.filter((n) => !n.isPriority);

  // Grouping function
  const groupNotifications = (notifs: AppNotification[]) => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - 7);

    notifs.forEach((notif) => {
      const date =
        typeof notif.createdAt === "string"
          ? new Date(notif.createdAt)
          : notif.createdAt?.toDate
          ? notif.createdAt.toDate()
          : new Date();

      if (date >= startOfToday) {
        today.push(notif);
      } else if (date >= startOfYesterday) {
        yesterday.push(notif);
      } else if (date >= startOfThisWeek) {
        thisWeek.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, thisWeek, earlier };
  };

  const { today, yesterday, thisWeek, earlier } = groupNotifications(generalNotifications);

  const getRelativeTime = (time: any) => {
    if (!time) return "Just now";
    const date =
      typeof time === "string"
        ? new Date(time)
        : time.toDate
        ? time.toDate()
        : new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d`;
  };

  const handleNotificationTap = async (notif: AppNotification) => {
    await handleMarkAsRead(notif.id);

    if (notif.destination === "profile" && notif.senderUsername) {
      navigate(`/${notif.senderUsername}`);
    } else if (notif.destination === "post" && notif.postId) {
      navigate(`/post/${notif.postId}`);
    } else if (notif.destination === "comment" && notif.postId) {
      navigate(`/post/${notif.postId}/comments`);
    } else if (notif.destination === "story") {
      // Open story lightbox modal
      setActiveStory({
        username: notif.senderUsername || "kyliejenner",
        photoURL: notif.senderPhotoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150",
        imageURL: notif.postImageURL || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&h=1000"
      });
    } else if (notif.targetId && notif.destination === "profile") {
      navigate(`/${notif.targetId}`); // fallback or target user profile UID
    }
  };

  // Helper to trigger simulated notifications
  const triggerSimulated = async (type: string) => {
    if (!profile?.uid) return;

    let title = "";
    let message = "";
    let senderUsername = "";
    let senderPhotoURL = "";
    let postImageURL = "";
    let destination: "profile" | "post" | "story" | "comment" = "profile";
    let mockPostId = "";

    const avatars = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150"
    ];

    switch (type) {
      case "follower":
        title = "New Follower";
        senderUsername = "selenagomez";
        senderPhotoURL = avatars[0];
        message = "started following you.";
        destination = "profile";
        break;
      case "follow_request":
        title = "Follow Request";
        senderUsername = "neymarjr";
        senderPhotoURL = avatars[1];
        message = "requested to follow you.";
        destination = "profile";
        break;
      case "follow_request_accepted":
        title = "Follow Request Accepted";
        senderUsername = "zendaya";
        senderPhotoURL = avatars[2];
        message = "accepted your follow request.";
        destination = "profile";
        break;
      case "like_post":
        title = "Like on Post";
        senderUsername = "cristiano";
        senderPhotoURL = avatars[3];
        message = "liked your post.";
        destination = "post";
        mockPostId = "demo_post_id";
        break;
      case "like_reel":
        title = "Like on Reel";
        senderUsername = "leomessi";
        senderPhotoURL = avatars[4];
        message = "liked your reel.";
        destination = "post";
        mockPostId = "demo_post_id";
        break;
      case "comment_post":
        title = "Comment on Post";
        senderUsername = "kyliejenner";
        senderPhotoURL = avatars[5];
        message = "commented on your post: 'Stunning shot! 😍🔥'";
        destination = "comment";
        mockPostId = "demo_post_id";
        break;
      case "comment_reel":
        title = "Comment on Reel";
        senderUsername = "mrbeast";
        senderPhotoURL = avatars[6];
        message = "commented on your reel: 'This is absolutely hilarious! 😂🍿'";
        destination = "comment";
        mockPostId = "demo_post_id";
        break;
      case "reply_comment":
        title = "Reply to Comment";
        senderUsername = "dualipa";
        senderPhotoURL = avatars[7];
        message = "replied to your comment: 'Can't wait to see more from you!'";
        destination = "comment";
        mockPostId = "demo_post_id";
        break;
      case "mention_comment":
        title = "Mention in Comment";
        senderUsername = "billieeilish";
        senderPhotoURL = avatars[8];
        message = "mentioned you in a comment: '@your_username check this out right now!'";
        destination = "comment";
        mockPostId = "demo_post_id";
        break;
      case "mention_caption":
        title = "Mention in Caption";
        senderUsername = "champagnepapi";
        senderPhotoURL = avatars[9];
        message = "mentioned you in a caption: 'Unforgettable vibes with @your_username ☀️🥂'";
        destination = "post";
        mockPostId = "demo_post_id";
        break;
      case "tag_post":
        title = "Tag in Post";
        senderUsername = "arianagrande";
        senderPhotoURL = avatars[0];
        message = "tagged you in a post.";
        destination = "post";
        mockPostId = "demo_post_id";
        break;
      case "tag_reel":
        title = "Tag in Reel";
        senderUsername = "travisscott";
        senderPhotoURL = avatars[1];
        message = "tagged you in a reel.";
        destination = "post";
        mockPostId = "demo_post_id";
        break;
      case "story_mention":
        title = "Story Mention";
        senderUsername = "justinbieber";
        senderPhotoURL = avatars[2];
        message = "mentioned you in their story.";
        destination = "story";
        postImageURL = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&h=1000";
        break;
      case "story_like":
        title = "Story Like";
        senderUsername = "taylorswift";
        senderPhotoURL = avatars[3];
        message = "liked your story.";
        destination = "story";
        postImageURL = "https://images.unsplash.com/photo-1618005198143-e52834643525?auto=format&fit=crop&w=600&h=1000";
        break;
      case "message_request":
        title = "Message Request";
        senderUsername = "therock";
        senderPhotoURL = avatars[4];
        message = "wants to send you a message.";
        destination = "profile";
        break;
      default:
        return;
    }

    // Adapt to personalized greeting if needed
    message = message.replace("@your_username", `@${profile.username}`);

    await addNotification(profile.uid, {
      userId: profile.uid,
      type,
      title,
      message,
      read: false,
      senderId: "simulated_" + senderUsername,
      senderUsername,
      senderPhotoURL,
      postImageURL,
      destination,
      postId: mockPostId || undefined
    });
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("like")) {
      return (
        <div className="p-2 bg-red-950/40 border border-red-900/30 rounded-lg text-red-500">
          <Heart className="w-4 h-4 fill-current" />
        </div>
      );
    }
    if (type.includes("comment") || type.includes("reply")) {
      return (
        <div className="p-2 bg-purple-950/40 border border-purple-900/30 rounded-lg text-purple-400">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    if (type.includes("mention") || type.includes("tag")) {
      return (
        <div className="p-2 bg-indigo-950/40 border border-indigo-900/30 rounded-lg text-indigo-400">
          <AtSign className="w-4 h-4" />
        </div>
      );
    }
    if (type.includes("follow")) {
      return (
        <div className="p-2 bg-emerald-950/40 border border-emerald-900/30 rounded-lg text-emerald-400">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    }
    if (type.includes("message")) {
      return (
        <div className="p-2 bg-amber-950/40 border border-amber-900/30 rounded-lg text-amber-400">
          <MessageCircle className="w-4 h-4" />
        </div>
      );
    }
    if (type === "verification_granted") {
      return (
        <div className="p-2 bg-blue-950/50 border border-blue-900/40 rounded-lg">
          <VerifiedBadge className="w-4 h-4" />
        </div>
      );
    }
    if (type === "verification_removed") {
      return (
        <div className="p-2 bg-neutral-900 border border-red-950/40 rounded-lg text-red-500">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-400">
        <Bell className="w-4 h-4" />
      </div>
    );
  };

  const unreadCount = filteredNotifs.filter((n) => !n.read).length;

  const renderNotificationGroup = (groupTitle: string, items: AppNotification[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3 pt-3" id={`notif-group-${groupTitle.toLowerCase().replace(" ", "-")}`}>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 px-1 select-none">
          {groupTitle}
        </h4>
        <div className="space-y-2">
          {items.map((notif) => {
            const isFollowType = notif.type === "follow";
            const isFollowedBack = notif.senderId ? followingIds.includes(notif.senderId) : false;

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`group relative p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4 cursor-pointer select-none ${
                  notif.read
                    ? "bg-zinc-950/10 border-neutral-950/60 hover:bg-neutral-900/20"
                    : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/70"
                }`}
                onClick={() => handleNotificationTap(notif)}
              >
                {/* Visual Unread Blue Dot Marker */}
                {!notif.read && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}

                {/* Sender Avatar */}
                <div className="shrink-0 relative">
                  <img
                    src={notif.senderPhotoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150"}
                    alt={notif.senderUsername || "User"}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-900 p-0.5"
                    referrerPolicy="no-referrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (notif.senderUsername) {
                        navigate(`/${notif.senderUsername}`);
                      }
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-neutral-900">
                    {notif.type.includes("like") && <Heart className="w-3 h-3 text-red-500 fill-current" />}
                    {(notif.type.includes("comment") || notif.type.includes("reply")) && <MessageSquare className="w-3 h-3 text-purple-400 fill-current" />}
                    {notif.type.includes("follow") && <UserPlus className="w-3 h-3 text-emerald-400" />}
                    {notif.type.includes("message") && <MessageCircle className="w-3 h-3 text-amber-400 fill-current" />}
                    {notif.type.includes("story") && <Sparkles className="w-3 h-3 text-fuchsia-400" />}
                    {notif.type.includes("verification_granted") && <VerifiedBadge className="w-3 h-3" />}
                  </div>
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs text-neutral-300 leading-normal">
                    {(() => {
                      const rawSenderUsername = notif.senderUsername || (notif.message.startsWith("@") ? notif.message.split(" ")[0].substring(1) : "someone");
                      const senderUsername = rawSenderUsername.replace(/[:!?.,'"]/g, "");
                      const displayMessage = notif.message.startsWith(`@${rawSenderUsername}`) 
                        ? notif.message.substring(rawSenderUsername.length + 1) // accounts for the space or directly trails
                        : notif.message;
                      
                      return (
                        <>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${senderUsername}`);
                            }}
                            className="font-black text-white hover:underline cursor-pointer mr-1.5"
                          >
                            @{senderUsername}
                          </span>
                          {displayMessage}
                        </>
                      );
                    })()}
                    <span className="text-[10px] text-neutral-500 font-bold ml-2 shrink-0">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </p>
                </div>

                {/* Dynamic Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isFollowType && notif.senderId && (
                    isFollowedBack ? (
                      <span className="text-[10px] font-bold tracking-tight text-neutral-500 px-2.5 py-1.5 bg-neutral-950/80 border border-neutral-900 rounded-lg flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Following
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFollowBack(notif.senderId!, notif.senderUsername || "user")}
                        className="text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        Follow Back
                      </button>
                    )
                  )}

                  {/* Thumbnail / Eye preview for media content */}
                  {notif.destination === "story" && (
                    <button
                      onClick={() => handleNotificationTap(notif)}
                      className="p-1.5 rounded-lg border border-neutral-800 text-fuchsia-400 hover:bg-fuchsia-950/20 hover:border-fuchsia-900/30 transition-all cursor-pointer"
                      title="Play Story"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete button option */}
                  <button
                    onClick={async () => {
                      if (profile?.uid) {
                        await deleteNotification(profile.uid, notif.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black select-none max-w-2xl mx-auto w-full relative" id="notifications-panel-root">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900 sticky top-0 bg-black/90 backdrop-blur-md z-10 shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5.5 h-5.5 text-white" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5">Keep track of your audience, reach and comments</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick simulation console switch */}
          <button
            onClick={() => setShowSimulateConsole(!showSimulateConsole)}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
              showSimulateConsole
                ? "bg-fuchsia-950/30 border-fuchsia-800/60 text-fuchsia-400"
                : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 text-gray-400 hover:text-white"
            }`}
            title="Simulate Alerts"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer px-3 py-2 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/30 rounded-lg active:scale-95"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* SIMULATE TEST ALERTS CONSOLE */}
      <AnimatePresence>
        {showSimulateConsole && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-neutral-950/75 border-b border-neutral-900/60"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-fuchsia-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Simulate Notification Activity</span>
                </div>
                <span className="text-[9px] text-neutral-500">Inject real-time event payloads</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "New Follower", type: "follower" },
                  { label: "Follow Request", type: "follow_request" },
                  { label: "Follow Accepted", type: "follow_request_accepted" },
                  { label: "Like on Post", type: "like_post" },
                  { label: "Like on Reel", type: "like_reel" },
                  { label: "Comment on Post", type: "comment_post" },
                  { label: "Comment on Reel", type: "comment_reel" },
                  { label: "Reply to Comment", type: "reply_comment" },
                  { label: "Mention in Comment", type: "mention_comment" },
                  { label: "Mention in Caption", type: "mention_caption" },
                  { label: "Tag in Post", type: "tag_post" },
                  { label: "Tag in Reel", type: "tag_reel" },
                  { label: "Story Mention", type: "story_mention" },
                  { label: "Story Like", type: "story_like" },
                  { label: "Message Request", type: "message_request" }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => triggerSimulated(item.type)}
                    className="text-[10px] text-left font-bold text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 px-2.5 py-1.5 rounded-lg truncate transition-all cursor-pointer active:scale-95"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATIONS CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-none pb-24">
        {/* PRIORITY SECTION */}
        {priorityNotifications.length > 0 && (
          <div className="space-y-3" id="notif-priority-section">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400 px-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Priority Alerts
            </h4>
            <div className="space-y-2">
              {priorityNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleNotificationTap(notif)}
                  className="p-4 rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/20 to-neutral-950 transition-all duration-200 cursor-pointer flex gap-4 relative"
                >
                  {/* Blue highlight marker */}
                  {!notif.read && (
                    <div className="absolute left-2 top-4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}

                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Message details */}
                  <div className="flex-1 min-w-0 text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-white flex items-center gap-1">
                        {notif.title}
                        {notif.type === "verification_granted" && <VerifiedBadge className="w-3.5 h-3.5 inline" />}
                      </h3>
                      <span className="text-[9px] text-neutral-500 font-bold">
                        • {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions / Dismiss */}
                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (profile?.uid) {
                          await deleteNotification(profile.uid, notif.id);
                        }
                      }}
                      className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* TIME-GROUPED SECTIONS */}
        {filteredNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-full mb-4">
              <Bell className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-sm font-bold text-neutral-300">No Notifications Yet</h3>
            <p className="text-xs text-neutral-500 max-w-[260px] mt-1.5 leading-relaxed">
              Updates about follows, tags, comments, likes and message requests will display here.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {renderNotificationGroup("Today", today)}
            {renderNotificationGroup("Yesterday", yesterday)}
            {renderNotificationGroup("This Week", thisWeek)}
            {renderNotificationGroup("Earlier", earlier)}
          </AnimatePresence>
        )}
      </div>

      {/* STORY VIEWER LIGHTBOX MODAL */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
            id="story-lightbox-root"
          >
            {/* Top segment indicator */}
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto z-15 flex flex-col gap-3">
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-fuchsia-600 transition-all duration-[40ms]"
                  style={{ width: `${storyProgress}%` }}
                />
              </div>

              {/* Story Header info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={activeStory.photoURL}
                    alt={activeStory.username}
                    className="w-8 h-8 rounded-full border border-white/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-black text-white hover:underline cursor-pointer">
                    @{activeStory.username}
                  </span>
                  <span className="text-[10px] text-zinc-400">Story Preview</span>
                </div>

                <button
                  onClick={() => setActiveStory(null)}
                  className="p-1 text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Visual media */}
            <div className="w-full h-full max-w-md relative flex items-center justify-center p-0">
              <img
                src={activeStory.imageURL}
                alt="Story content"
                className="w-full h-full object-cover sm:max-h-[85vh] sm:rounded-2xl border border-neutral-900"
                referrerPolicy="no-referrer"
              />

              {/* Tap overlays left/right */}
              <div
                className="absolute left-0 inset-y-0 w-1/3 cursor-pointer"
                onClick={() => {
                  setStoryProgress(0); // Reset progress or go back
                }}
              />
              <div
                className="absolute right-0 inset-y-0 w-1/3 cursor-pointer"
                onClick={() => {
                  setActiveStory(null); // Advance / Close
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
