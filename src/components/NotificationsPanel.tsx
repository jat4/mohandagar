import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  subscribeToFollowing,
  followUser,
  unfollowUser,
  addNotification
} from "../services/dbService";
import { AppNotification } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageSquare, Trash2, CheckCircle, Bell, Sparkles, UserPlus, UserCheck } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";

export default function NotificationsPanel() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "follow" | "like" | "comment" | "verification">("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;

    // Real-time subscription to notifications
    const unsubscribeNotifs = subscribeToNotifications(profile.uid, (notifs) => {
      setNotifications(notifs);
    });

    // Real-time subscription to following list
    const unsubscribeFollowing = subscribeToFollowing(profile.uid, (ids) => {
      setFollowingIds(ids);
    });

    return () => {
      unsubscribeNotifs();
      unsubscribeFollowing();
    };
  }, [profile?.uid]);

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

  const handleFollowBack = async (targetUserId: string) => {
    if (!profile?.uid) return;
    try {
      await followUser(profile.uid, targetUserId);
      // Dispatch follow back notification
      await addNotification(targetUserId, {
        userId: targetUserId,
        type: "follow",
        title: "New Follower!",
        message: `@${profile.username} started following you back.`,
        read: false,
        senderId: profile.uid
      });
    } catch (err) {
      console.error("Failed to follow user back:", err);
    }
  };

  const filteredNotifs = notifications.filter((notif) => {
    if (filter === "all") return true;
    return notif.type === filter;
  });

  const getRelativeTime = (time: any) => {
    if (!time) return "Just now";
    const date = typeof time === "string" ? new Date(time) : time.toDate ? time.toDate() : new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-black select-none max-w-2xl mx-auto w-full" id="notifications-panel-root">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-900 sticky top-0 bg-black z-10 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-[10px] text-gray-500 mt-1">Stay updated with your active chats & post reach</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer px-2.5 py-1.5 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/30 rounded-lg"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 px-6 py-3 border-b border-gray-950 overflow-x-auto shrink-0 scrollbar-none">
        {(["all", "follow", "like", "comment", "verification"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
              filter === tab
                ? "bg-white text-black border-white"
                : "bg-neutral-900 text-gray-400 border-gray-850 hover:text-white"
            }`}
          >
            {tab === "all" ? "All" : tab === "follow" ? "Follows" : tab + "s"}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-none">
        <AnimatePresence initial={false}>
          {filteredNotifs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="p-4 bg-neutral-900/50 border border-gray-850 rounded-full mb-4">
                <Bell className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-300">No Notifications</h3>
              <p className="text-xs text-gray-500 max-w-[240px] mt-1.5 leading-relaxed">
                Interactions on your posts or profile verifications will show up here.
              </p>
            </motion.div>
          ) : (
            filteredNotifs.map((notif) => {
              const isFollowType = notif.type === "follow";
              const isFollowedBack = notif.senderId ? followingIds.includes(notif.senderId) : false;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                    notif.read
                      ? "bg-neutral-950/20 border-gray-900 text-gray-400"
                      : "bg-neutral-900 border-gray-800 text-white"
                  }`}
                >
                  {/* Notification Icon */}
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "like" && (
                      <div className="p-2 bg-red-950/30 border border-red-900/40 rounded-lg text-red-400">
                        <Heart className="w-4 h-4 fill-current" />
                      </div>
                    )}
                    {notif.type === "comment" && (
                      <div className="p-2 bg-purple-950/30 border border-purple-900/40 rounded-lg text-purple-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    )}
                    {notif.type === "follow" && (
                      <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-emerald-400">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    )}
                    {notif.type === "verification" && (
                      <div className="p-2 bg-blue-950/30 border border-blue-900/40 rounded-lg">
                        <VerifiedBadge className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-white leading-tight">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-500 font-medium">
                        • {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isFollowType && notif.senderId && (
                      isFollowedBack ? (
                        <span className="text-[10px] px-2.5 py-1.5 rounded-lg border border-neutral-800 text-neutral-500 bg-neutral-950 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFollowBack(notif.senderId!)}
                          className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow Back
                        </button>
                      )
                    )}

                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
