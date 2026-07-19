import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, toggleUserProfileVerification, addNotification } from "../services/dbService";
import { UserProfile } from "../types";
import VerifiedBadge from "./VerifiedBadge";
import { ShieldAlert, Search, CheckCircle2, XCircle, Users, Award, Shield, Check, Info } from "lucide-react";
import { motion } from "motion/react";

export default function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchUsers();
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
      
      // Send notification if they are being verified
      if (isNowVerified) {
        await addNotification(targetUser.uid, {
          userId: targetUser.uid,
          type: "verification",
          title: "Congratulations! 🎉",
          message: "Your account is now verified! You've received the Blue Badge on Mohan Dagar.",
          read: false
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

  if (profile?.username !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 max-w-md">
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

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white overflow-y-auto">
      {/* Header Banner */}
      <div className="border-b border-gray-900 bg-neutral-950 p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Mohan Dagar Admin Console <span className="text-[10px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Superuser</span>
              </h1>
              <p className="text-xs text-gray-400">Exclusive controls to moderate accounts, verify profiles, and manage system assets.</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-gray-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl flex items-center gap-4">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Users</p>
              <h3 className="text-xl font-bold">{totalUsersCount}</h3>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl flex items-center gap-4">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <Award className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Verified Accounts</p>
              <h3 className="text-xl font-bold text-green-400">{verifiedCount}</h3>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-4 border border-gray-900 rounded-xl flex items-center gap-4">
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

      {/* Main Panel Content */}
      <div className="p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto">
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
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Search controls */}
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
          <div className="text-xs text-gray-500 self-end sm:self-center">
            Showing <strong className="text-gray-300">{filteredUsers.length}</strong> of {totalUsersCount} accounts
          </div>
        </div>

        {/* Accounts List Container */}
        <div className="bg-neutral-950 border border-gray-900 rounded-xl overflow-hidden">
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
            <div className="divide-y divide-gray-900">
              {filteredUsers.map((u) => {
                const isUserAdmin = u.username === "admin";
                return (
                  <div key={u.uid} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-900/20 transition-all">
                    {/* User Profile info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={u.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.uid}`}
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

                    {/* Verification Toggle Actions */}
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
                              : "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/10"
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
