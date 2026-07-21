import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAllUsers,
  toggleUserProfileVerification,
  addNotification,
  subscribeToFeed,
  deletePost,
  subscribeToPostReports,
  updatePostReportStatus
} from "../services/dbService";
import { UserProfile, Post, PostReport } from "../types";
import { DEFAULT_AVATAR_URL } from "../constants";
import VerifiedBadge from "./VerifiedBadge";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Award,
  Shield,
  Check,
  Info,
  Layers,
  FileText,
  AlertTriangle,
  Settings,
  BarChart3,
  HardDrive,
  Trash2,
  Lock,
  Flame,
  MousePointerClick,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminPanel() {
  const { profile } = useAuth();
  const { section = "users" } = useParams<{ section?: string }>();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // System Setting mock states (to show inside settings tab)
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewSignups, setAllowNewSignups] = useState(true);
  const [guestBrowsing, setGuestBrowsing] = useState(true);

  // Load system records
  useEffect(() => {
    fetchUsers();
  }, []);

  // Subscribe to all posts for post moderation
  useEffect(() => {
    const unsubscribe = subscribeToFeed((loadedPosts) => {
      setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to all reports for reports moderation
  useEffect(() => {
    const unsubscribe = subscribeToPostReports((loadedReports) => {
      setReports(loadedReports);
    });
    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (targetUser: UserProfile) => {
    setActionLoadingId(targetUser.uid);
    setMessage(null);
    const isNowVerified = !targetUser.isVerified;
    try {
      await toggleUserProfileVerification(targetUser.uid, !!targetUser.isVerified);

      // Send notification if they are being verified or unverified
      if (isNowVerified) {
        await addNotification(targetUser.uid, {
          userId: targetUser.uid,
          type: "verification_granted",
          title: "Your account has been verified.",
          message: "Congratulations! Your account has been verified by the admin. You will now see a blue verified badge next to your username across the platform. To keep your verified status, continue following our Community Guidelines.",
          read: false,
          isPriority: true,
          destination: "profile",
          targetId: targetUser.uid
        });
      } else {
        await addNotification(targetUser.uid, {
          userId: targetUser.uid,
          type: "verification_removed",
          title: "Your verified badge has been removed.",
          message: "Your account is no longer verified. If you believe this is a mistake, please contact support.",
          read: false,
          isPriority: true,
          destination: "profile",
          targetId: targetUser.uid
        });
      }

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, isVerified: isNowVerified } : u))
      );

      setMessage({
        text: `@${targetUser.username} is now ${isNowVerified ? "Verified" : "Unverified"} successfully!`,
        type: "success"
      });
    } catch (err) {
      setMessage({ text: "Failed to update verification status. Please try again.", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePost = async (postId: string, ownerUsername: string) => {
    if (confirm(`Are you sure you want to moderate and delete the post by @${ownerUsername}? This action is irreversible.`)) {
      try {
        await deletePost(postId);
        setMessage({
          text: `Post by @${ownerUsername} has been moderated and permanently deleted.`,
          type: "success"
        });
      } catch (err) {
        setMessage({ text: "Failed to delete post.", type: "error" });
      }
    }
  };

  const handleResolveReport = async (reportId: string, status: "Approved" | "Rejected") => {
    setActionLoadingId(reportId);
    try {
      await updatePostReportStatus(reportId, status);
      setMessage({
        text: `Report ticket resolved as ${status}!`,
        type: "success"
      });
    } catch (err) {
      console.error(err);
      setMessage({
        text: "Failed to update report status. Please try again.",
        type: "error"
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (profile?.username !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black min-h-screen text-white">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 max-w-md text-sm">
          Only the administrator account (@admin) has access to these extra administrative controls.
        </p>
      </div>
    );
  }

  // Filter users based on query
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsersCount = users.length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const unverifiedCount = totalUsersCount - verifiedCount;

  // Mock report tickets
  const reportsMock = [
    { id: "REP-401", target: "@john_doe", reporter: "@jane_smith", reason: "Harassment in dynamic chats", status: "pending", date: "Just now" },
    { id: "REP-398", target: "Post ID #p089", reporter: "@mohammad_78", reason: "Copyright infringement", status: "resolved", date: "2 hours ago" },
    { id: "REP-395", target: "@scam_bot", reporter: "@system_detector", reason: "Spamming links", status: "pending", date: "1 day ago" }
  ];

  const adminTabs = [
    { id: "users", label: "Accounts", icon: Users },
    { id: "verification", label: "Pending Verification", icon: Award },
    { id: "posts", label: "Posts Mod", icon: FileText },
    { id: "reports", label: "Reports Logs", icon: AlertTriangle },
    { id: "settings", label: "System Config", icon: Settings },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "storage", label: "Storage", icon: HardDrive }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white overflow-y-auto">
      {/* Header Banner */}
      <div className="border-b border-gray-900 bg-neutral-950 p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Mohan Dagar Admin Console{" "}
                <span className="text-[10px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Superuser
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Exclusive controls to moderate accounts, verify profiles, and manage system assets.
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-gray-800 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-auto"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl flex items-center gap-4 text-left">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Users</p>
              <h3 className="text-xl font-bold">{totalUsersCount}</h3>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl flex items-center gap-4 text-left">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <Award className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Verified Accounts</p>
              <h3 className="text-xl font-bold text-green-400">{verifiedCount}</h3>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl flex items-center gap-4 text-left">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Unverified Accounts</p>
              <h3 className="text-xl font-bold text-yellow-500">{unverifiedCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Horizontal Tab Sub-Navigation */}
      <div className="border-b border-gray-950 bg-neutral-950 px-6 shrink-0 overflow-x-auto flex gap-1 select-none scrollbar-none">
        {adminTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = section === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/admin-panel/${tab.id}`)}
              className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Panel Content Area */}
      <div className="p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto text-left">
        {/* Dynamic Alerts */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white cursor-pointer">
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* SECTION: USERS */}
          {section === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search user profiles by name or @username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-800 rounded-lg pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-gray-500"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Showing <strong className="text-gray-300">{filteredUsers.length}</strong> of {totalUsersCount} accounts
                </div>
              </div>

              <div className="bg-neutral-950 border border-gray-900 rounded-xl overflow-hidden divide-y divide-gray-900">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <span>Loading system records...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Info className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm">No accounts found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isUserAdmin = u.username === "admin";
                    return (
                      <div key={u.uid} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-900/20 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={u.photoURL || DEFAULT_AVATAR_URL}
                            alt={u.username}
                            className="w-11 h-11 rounded-full object-cover border border-gray-800 bg-neutral-900"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white truncate">@{u.username}</span>
                              {u.isVerified && <VerifiedBadge className="w-4 h-4" />}
                              {isUserAdmin && (
                                <span className="text-[9px] bg-red-500/15 border border-red-500/30 text-red-400 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{u.fullName || "No Name Set"}</p>
                            <p className="text-[10px] text-gray-600 truncate mt-0.5">{u.email}</p>
                          </div>
                        </div>

                        <div>
                          {isUserAdmin ? (
                            <span className="text-[11px] text-gray-600 italic select-none">System Protected</span>
                          ) : (
                            <button
                              onClick={() => handleToggleVerification(u)}
                              disabled={actionLoadingId !== null}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                                u.isVerified
                                  ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
                                  : "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg"
                              }`}
                            >
                              {actionLoadingId === u.uid ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : u.isVerified ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Remove Blue Tick
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Give Blue Tick
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION: PENDING VERIFICATION */}
          {section === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-neutral-900/20 border border-gray-900 rounded-xl p-5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  Verification Queues
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Showing accounts awaiting verification ticks. Instantly grant the verification badge below.
                </p>
              </div>

              <div className="bg-neutral-950 border border-gray-900 rounded-xl overflow-hidden divide-y divide-gray-900">
                {users.filter(u => !u.isVerified && u.username !== "admin").length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white">All Clear!</p>
                    <p className="text-xs text-gray-500 mt-1">All registered profiles are verified.</p>
                  </div>
                ) : (
                  users
                    .filter(u => !u.isVerified && u.username !== "admin")
                    .map((u) => (
                      <div key={u.uid} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-900/10 transition-all">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={u.photoURL || DEFAULT_AVATAR_URL}
                            alt={u.username}
                            className="w-10 h-10 rounded-full object-cover border border-gray-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-sm text-white">@{u.username}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{u.fullName}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleVerification(u)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Verify Account
                        </button>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION: POSTS MODERATION */}
          {section === "posts" && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-neutral-900/20 border border-gray-900 rounded-xl p-5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-400" />
                  Visual Content Moderation
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  View, audit, and moderate user posts. Instantly remove posts violating community directives.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.length === 0 ? (
                  <div className="col-span-full bg-neutral-950 border border-gray-900 p-12 text-center text-gray-500 rounded-xl">
                    <p className="text-sm">No live posts in the system database.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-neutral-950 border border-gray-900 rounded-xl p-4 flex gap-4 hover:border-gray-800 transition-colors">
                      <img
                        src={post.imageURL}
                        alt="Audit thumb"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-800 bg-black shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="text-left">
                          <span className="text-xs font-bold text-gray-400 block">Posted by @{post.ownerUsername}</span>
                          <p className="text-xs text-white line-clamp-2 mt-1 italic">"{post.caption || "No Caption"}"</p>
                          <span className="text-[9px] text-gray-600 block mt-1">Likes: {post.likes?.length || 0} • Comments: {post.commentsCount || 0}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePost(post.id, post.ownerUsername)}
                          className="self-start text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 mt-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Post
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION: REPORTS */}
          {section === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-neutral-950 border border-gray-900 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-gray-800 text-gray-400">
                      <th className="p-4 font-bold uppercase">Ticket</th>
                      <th className="p-4 font-bold uppercase">Target Asset</th>
                      <th className="p-4 font-bold uppercase">Reporter</th>
                      <th className="p-4 font-bold uppercase">Reason</th>
                      <th className="p-4 font-bold uppercase">Status</th>
                      <th className="p-4 font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                          No reports recorded in the database.
                        </td>
                      </tr>
                    ) : (
                      reports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-neutral-900/10">
                          <td className="p-4 font-bold text-white tracking-mono">
                            {rep.id.substring(0, 8)}...
                          </td>
                          <td className="p-4 text-red-400 font-semibold text-left">
                            <div className="flex flex-col gap-1">
                              <a
                                href={`/post/${rep.postId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-red-400 hover:text-red-300 font-bold"
                              >
                                Post ID #{rep.postId.substring(0, 8)}...
                              </a>
                              <span className="text-[10px] text-gray-500">
                                Owner: @{rep.postOwnerUsername}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400">@{rep.reporterUsername}</td>
                          <td className="p-4 text-gray-300">
                            <div className="flex flex-col gap-1 text-left">
                              <span className="font-bold">"{rep.reason}"</span>
                              {rep.additionalDetails && (
                                <span className="text-[10px] text-gray-500 italic max-w-xs block font-normal leading-relaxed whitespace-pre-wrap">
                                  {rep.additionalDetails}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rep.status === "Pending"
                                ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500"
                                : rep.status === "Approved"
                                ? "bg-green-500/10 border border-green-500/20 text-green-500"
                                : "bg-red-500/10 border border-red-500/20 text-red-500"
                            }`}>
                              {rep.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {rep.status === "Pending" ? (
                              <div className="flex gap-2">
                                <button
                                  disabled={actionLoadingId === rep.id}
                                  onClick={() => handleResolveReport(rep.id, "Approved")}
                                  className="text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={actionLoadingId === rep.id}
                                  onClick={() => handleResolveReport(rep.id, "Rejected")}
                                  className="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500">None</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* SECTION: SYSTEM CONFIG */}
          {section === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-neutral-950 border border-gray-900 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Instance Configuration</h3>
                  <p className="text-xs text-gray-500 mt-1">Control active platform policies and security gates.</p>
                </div>

                <div className="space-y-4 divide-y divide-gray-900">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Maintenance Shutdown Mode</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Locks out everyone except @admin to facilitate database migrations.</p>
                    </div>
                    <button
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                        maintenanceMode ? "bg-red-600" : "bg-neutral-800"
                      }`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        maintenanceMode ? "translate-x-5" : ""
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 pt-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Allow Public Registration</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Enables users to sign up for new accounts.</p>
                    </div>
                    <button
                      onClick={() => setAllowNewSignups(!allowNewSignups)}
                      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                        allowNewSignups ? "bg-green-600" : "bg-neutral-800"
                      }`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        allowNewSignups ? "translate-x-5" : ""
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 pt-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Guest Browsing Allowed</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Permits guests to view the public feed without logging in.</p>
                    </div>
                    <button
                      onClick={() => setGuestBrowsing(!guestBrowsing)}
                      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                        guestBrowsing ? "bg-green-600" : "bg-neutral-800"
                      }`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        guestBrowsing ? "translate-x-5" : ""
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION: ANALYTICS */}
          {section === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 animate-fade-in"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Metric A: Engagement Rate */}
                <div className="bg-neutral-950 p-6 border border-gray-900 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Daily Active Ticks</span>
                      <h2 className="text-2xl font-black mt-1">94.8%</h2>
                    </div>
                    <div className="bg-green-500/10 p-2.5 rounded-lg">
                      <Flame className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  {/* Premium customized SVG progress sparkline */}
                  <div className="mt-6">
                    <svg viewBox="0 0 300 60" className="w-full h-16 text-green-400 stroke-2 fill-none">
                      <path d="M 0 50 Q 50 20 100 40 T 200 10 T 300 30" stroke="currentColor" />
                      <circle cx="200" cy="10" r="4" fill="#22c55e" />
                    </svg>
                  </div>
                </div>

                {/* Metric B: Clickthrough Ticks */}
                <div className="bg-neutral-950 p-6 border border-gray-900 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Total Visual Actions</span>
                      <h2 className="text-2xl font-black mt-1">12,480</h2>
                    </div>
                    <div className="bg-blue-500/10 p-2.5 rounded-lg">
                      <MousePointerClick className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <svg viewBox="0 0 300 60" className="w-full h-16 text-blue-400 stroke-2 fill-none">
                      <path d="M 0 45 Q 60 10 120 30 T 240 25 T 300 5" stroke="currentColor" />
                      <circle cx="300" cy="5" r="4" fill="#3b82f6" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION: STORAGE */}
          {section === "storage" && (
            <motion.div
              key="storage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-neutral-950 border border-gray-900 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-purple-400" />
                    System Storage Map
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Status of cloud firestore, local cache records, and media bucket storage.</p>
                </div>

                <div className="space-y-4">
                  {/* Bar 1 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                      <span className="text-gray-300">Firestore Cloud Data</span>
                      <span className="text-purple-400">0.24 MB / 100 MB free quota</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "2%" }} />
                    </div>
                  </div>

                  {/* Bar 2 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold pt-2">
                      <span className="text-gray-300">Local Cache Data Storage</span>
                      <span className="text-blue-400">1.4 MB / 5.0 MB quota</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "28%" }} />
                    </div>
                  </div>

                  {/* Bar 3 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold pt-2">
                      <span className="text-gray-300">Media CDN Host Assets</span>
                      <span className="text-green-400">48.2 MB / 1000 MB</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "4.8%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
