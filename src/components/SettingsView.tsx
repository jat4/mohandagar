import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PROFILE_AVATARS, DEFAULT_AVATAR_URL } from "../constants";
import { createUserProfile, checkUsernameExists, getUserProfile } from "../services/dbService";
import {
  User,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  Check,
  Save,
  Lock,
  Menu,
  ChevronRight,
  Info,
  Camera,
  Upload
} from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";

type SettingsTab = "edit-profile" | "privacy" | "notifications" | "about";

interface SettingsViewProps {
  onBackToFeed?: () => void;
}

export default function SettingsView({ onBackToFeed }: SettingsViewProps) {
  const { profile, logOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("edit-profile");
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tab) return;
    if (tab === "profile" || tab === "edit-profile") {
      setActiveTab("edit-profile");
      setShowBlockedList(false);
    } else if (tab === "privacy") {
      setActiveTab("privacy");
      setShowBlockedList(false);
    } else if (tab === "blocked") {
      setActiveTab("privacy");
      setShowBlockedList(true);
    } else if (tab === "security" || tab === "account" || tab === "notifications") {
      setActiveTab("notifications");
      setShowBlockedList(false);
    } else if (tab === "help" || tab === "about") {
      setActiveTab("about");
      setShowBlockedList(false);
    }
  }, [tab]);

  // Edit profile form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    loading: boolean;
  }>({ checked: true, available: true, loading: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Privacy states
  const [isPrivate, setIsPrivate] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);

  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockedProfiles, setBlockedProfiles] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (showBlockedList && profile?.blockedUsers?.length) {
      setLoadingBlocked(true);
      const fetchBlocked = async () => {
        const loaded: any[] = [];
        for (const uid of profile.blockedUsers || []) {
          try {
            const p = await getUserProfile(uid);
            if (p) loaded.push(p);
          } catch (err) {
            console.error(err);
          }
        }
        setBlockedProfiles(loaded);
        setLoadingBlocked(false);
      };
      fetchBlocked();
    } else {
      setBlockedProfiles([]);
    }
  }, [showBlockedList, profile?.blockedUsers]);

  const handleTogglePrivacy = async (newVal: boolean) => {
    if (!profile) return;
    setIsPrivate(newVal);
    try {
      await createUserProfile(profile.uid, {
        ...profile,
        isPrivate: newVal
      });
      await refreshProfile();
    } catch (err) {
      console.error("Failed to update privacy:", err);
    }
  };

  const handleUnblockUser = async (targetUserId: string) => {
    if (!profile) return;
    const updatedBlocked = (profile.blockedUsers || []).filter(uid => uid !== targetUserId);
    try {
      await createUserProfile(profile.uid, {
        ...profile,
        blockedUsers: updatedBlocked
      });
      await refreshProfile();
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  // Notification states
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Expanded Instagram-style notification preferences
  const [likesPref, setLikesPref] = useState(true);
  const [commentsPref, setCommentsPref] = useState(true);
  const [mentionsPref, setMentionsPref] = useState(true);
  const [tagsPref, setTagsPref] = useState(true);
  const [followsPref, setFollowsPref] = useState(true);
  const [messagesPref, setMessagesPref] = useState(true);
  const [storiesPref, setStoriesPref] = useState(true);

  // Load notification preferences
  useEffect(() => {
    if (!profile?.uid) return;
    const stored = localStorage.getItem(`dagar_notification_prefs_${profile.uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.likes !== undefined) setLikesPref(parsed.likes);
        if (parsed.comments !== undefined) setCommentsPref(parsed.comments);
        if (parsed.mentions !== undefined) setMentionsPref(parsed.mentions);
        if (parsed.tags !== undefined) setTagsPref(parsed.tags);
        if (parsed.follows !== undefined) setFollowsPref(parsed.follows);
        if (parsed.messages !== undefined) setMessagesPref(parsed.messages);
        if (parsed.stories !== undefined) setStoriesPref(parsed.stories);
      } catch (e) {
        console.error("Failed to parse notification prefs:", e);
      }
    }
  }, [profile?.uid]);

  const updatePreference = (key: string, value: boolean) => {
    if (!profile?.uid) return;
    const stored = localStorage.getItem(`dagar_notification_prefs_${profile.uid}`);
    const parsed = stored ? JSON.parse(stored) : {
      likes: true, comments: true, mentions: true, tags: true, follows: true, messages: true, stories: true
    };
    parsed[key] = value;
    localStorage.setItem(`dagar_notification_prefs_${profile.uid}`, JSON.stringify(parsed));
    
    if (key === "likes") setLikesPref(value);
    if (key === "comments") setCommentsPref(value);
    if (key === "mentions") setMentionsPref(value);
    if (key === "tags") setTagsPref(value);
    if (key === "follows") setFollowsPref(value);
    if (key === "messages") setMessagesPref(value);
    if (key === "stories") setStoriesPref(value);
  };

  // Load profile data on start
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setBio(profile.bio || "");
      setSelectedAvatar(profile.photoURL || "");
      setUsername(profile.username || "");
      setIsPrivate(!!profile.isPrivate);
      setUsernameStatus({ checked: true, available: true, loading: false });
    }
  }, [profile]);

  const validateUsername = (val: string) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(val);
  };

  // Debounced check for username change
  useEffect(() => {
    if (!profile) return;
    const activeUsername = username.trim().toLowerCase();

    // If it's empty or hasn't loaded yet
    if (!activeUsername) return;

    // If it matches their current username, it's immediately available
    if (activeUsername === profile.username.toLowerCase()) {
      setUsernameStatus({ checked: true, available: true, loading: false });
      return;
    }

    if (activeUsername.length < 3 || !validateUsername(activeUsername)) {
      setUsernameStatus({ checked: true, available: false, loading: false });
      return;
    }

    setUsernameStatus({ checked: false, available: false, loading: true });
    let active = true;

    const delayDebounce = setTimeout(async () => {
      try {
        const exists = await checkUsernameExists(activeUsername);
        if (active) {
          setUsernameStatus({
            checked: true,
            available: !exists,
            loading: false
          });
        }
      } catch {
        if (active) {
          setUsernameStatus({ checked: true, available: false, loading: false });
        }
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [username, profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        setSaveError("Profile photo exceeds the 200KB limit. Please select a smaller image.");
        return;
      }
      setSaveError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const cleanUser = username.trim().toLowerCase();
    if (!validateUsername(cleanUser)) {
      setSaveError("Username must be 3-20 characters and contain only letters, numbers, or underscores.");
      return;
    }

    if (!usernameStatus.available) {
      setSaveError(`@${cleanUser} is taken or invalid. Please choose another username.`);
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      await createUserProfile(profile.uid, {
        username: cleanUser,
        email: profile.email,
        fullName: fullName.trim(),
        bio: bio.trim(),
        photoURL: selectedAvatar,
      });

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update settings:", err);
      setSaveError(err.message || "Something went wrong while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "edit-profile" as SettingsTab, label: "Edit Profile", icon: User },
    { id: "privacy" as SettingsTab, label: "Privacy & Security", icon: Lock },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    { id: "about" as SettingsTab, label: "Help & About", icon: HelpCircle },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-black text-white select-none overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-80 border-r border-gray-900 bg-black flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-900 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Settings</h2>
          {onBackToFeed && (
            <button
              onClick={onBackToFeed}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
        </div>

        {/* Tab Items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  const targetSubPath = 
                    tab.id === 'edit-profile' ? 'profile' :
                    tab.id === 'notifications' ? 'security' :
                    tab.id;
                  navigate('/settings/' + targetSubPath);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 text-white font-semibold"
                    : "text-gray-400 hover:bg-neutral-950 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4.5 h-4.5 ${isSelected ? "text-blue-500" : "text-gray-400"}`} />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${isSelected ? "rotate-90 text-blue-500" : ""}`} />
              </button>
            );
          })}

          <div className="pt-6 border-t border-gray-900 mt-6 px-4">
            <button
              onClick={logOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/10 rounded-lg transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Settings Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-black">
        <div className="max-w-2xl mx-auto">
          {/* TAB CONTENT: EDIT PROFILE */}
          {activeTab === "edit-profile" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
                <p className="text-xs text-gray-400 mt-1">Update your display information and account aesthetics.</p>
              </div>

              {/* Mini User Row with File Upload */}
              <div className="flex items-center gap-5 bg-neutral-950 p-5 border border-gray-900 rounded-2xl">
                <div className="relative group">
                  <img
                    src={selectedAvatar || DEFAULT_AVATAR_URL}
                    alt={profile?.username}
                    className="w-20 h-20 rounded-full border border-gray-800 object-cover bg-neutral-900"
                  />
                  <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg text-white">{profile?.username}</span>
                    {profile?.isVerified && <VerifiedBadge className="w-4.5 h-4.5" />}
                  </div>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                  
                  {/* File upload button */}
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-xs text-gray-300 px-3 py-1.5 rounded-lg cursor-pointer transition-all font-semibold">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Profile Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar(DEFAULT_AVATAR_URL)}
                      className="inline-flex items-center gap-1.5 bg-red-950/25 hover:bg-red-950/40 border border-red-900/40 text-xs text-red-400 px-3 py-1.5 rounded-lg cursor-pointer transition-all font-semibold"
                    >
                      Remove Photo
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600">Max size: 200KB (JPEG/PNG/WEBP)</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Username Change Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                      className="w-full bg-neutral-905 border border-gray-800 rounded-lg pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="username"
                      required
                    />
                  </div>
                  {username && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {usernameStatus.loading ? (
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {usernameStatus.checked && !usernameStatus.loading && (
                        <p className={`text-xs ${usernameStatus.available ? "text-green-400" : "text-red-400"}`}>
                          {usernameStatus.available
                            ? `@${username} is available!`
                            : `@${username} is taken or invalid.`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Full Name field */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-905 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Biography textarea */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-neutral-905 border border-gray-800 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                    placeholder="Tell other Mohan Dagar members about yourself..."
                    maxLength={300}
                  />
                  <div className="text-right text-[10px] text-gray-500">
                    {bio.length}/300 characters
                  </div>
                </div>

                {/* Notifications feedback */}
                {saveSuccess && (
                  <div className="p-3.5 bg-green-950/30 border border-green-800/40 text-green-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    Profile settings successfully updated and synchronized!
                  </div>
                )}

                {saveError && (
                  <div className="p-3.5 bg-red-950/30 border border-red-800/40 text-red-400 rounded-lg text-xs font-semibold">
                    {saveError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-bold rounded-lg py-3.5 mt-2 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}



          {/* TAB CONTENT: PRIVACY */}
          {activeTab === "privacy" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Privacy & Security</h1>
                <p className="text-xs text-gray-400 mt-1">Manage account visibility and status settings.</p>
              </div>

              {/* Option Rows */}
              <div className="space-y-4 bg-neutral-950 p-6 border border-gray-900 rounded-xl">
                {showBlockedList ? (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                      <div>
                        <h3 className="font-bold text-white text-sm">Blocked Accounts</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Accounts you have blocked cannot find or see your posts.</p>
                      </div>
                      <button
                        onClick={() => navigate('/settings/privacy')}
                        className="text-xs text-blue-500 font-bold hover:text-blue-400 cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {loadingBlocked ? (
                        <p className="text-xs text-gray-500 italic text-center py-4 animate-pulse">Loading blocked users...</p>
                      ) : blockedProfiles.length === 0 ? (
                        <p className="text-xs text-gray-500 italic text-center py-4">You haven't blocked anyone yet.</p>
                      ) : (
                        blockedProfiles.map((user) => (
                          <div key={user.uid} className="flex items-center justify-between bg-neutral-900 p-3 border border-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.photoURL}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover border border-gray-850"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-left">
                                <span className="font-bold text-xs text-white">@{user.username}</span>
                                <p className="text-[10px] text-gray-500">{user.fullName}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblockUser(user.uid)}
                              className="text-[10px] font-bold bg-neutral-950 hover:bg-neutral-850 border border-gray-800 text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Unblock
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-gray-900">
                      <div>
                        <h4 className="font-semibold text-sm text-white">Private Account</h4>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-sm">When your account is private, only people you approve can see your posts and stories.</p>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy(!isPrivate)}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                          isPrivate ? "bg-blue-600" : "bg-neutral-800"
                        }`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          isPrivate ? "translate-x-5" : ""
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-900">
                      <div>
                        <h4 className="font-semibold text-sm text-white">Show Activity Status</h4>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-sm">Allow accounts you follow and anyone you message to see when you were last active or are currently online.</p>
                      </div>
                      <button
                        onClick={() => setActivityStatus(!activityStatus)}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                          activityStatus ? "bg-blue-600" : "bg-neutral-800"
                        }`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          activityStatus ? "translate-x-5" : ""
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h4 className="font-semibold text-sm text-white">Blocked Accounts</h4>
                        <p className="text-xs text-gray-500 mt-0.5">View and manage blocked users list.</p>
                      </div>
                      <button
                        onClick={() => navigate('/settings/blocked')}
                        className="text-xs text-blue-500 font-bold hover:text-blue-400 cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-xs text-gray-400 mt-1">Configure your alert settings and mute schedules.</p>
              </div>

              {/* General Settings */}
              <div className="space-y-4 bg-neutral-950 p-6 border border-gray-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">General</h3>
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Pause All Notifications</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Temporarily stop incoming notification sounds and popups.</p>
                  </div>
                  <button
                    onClick={() => setMuteNotifications(!muteNotifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      muteNotifications ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      muteNotifications ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Notification Sound</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Play dynamic premium audio ping on receiving alerts.</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      soundEnabled ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      soundEnabled ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>
              </div>

              {/* Preference Controls */}
              <div className="space-y-4 bg-neutral-950 p-6 border border-gray-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Notification Preferences</h3>
                
                {/* Likes Pref */}
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Likes</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified when someone likes your posts or reels.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("likes", !likesPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      likesPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      likesPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Comments Pref */}
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Comments</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified when someone comments on your posts or reels.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("comments", !commentsPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      commentsPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      commentsPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Mentions Pref */}
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Mentions</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified when someone mentions you in captions or comments.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("mentions", !mentionsPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      mentionsPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      mentionsPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Tags Pref */}
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Tags</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified when you are tagged in posts or reels.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("tags", !tagsPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      tagsPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      tagsPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Follows Pref */}
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Follows</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified on new followers or follow requests.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("follows", !followsPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      followsPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      followsPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Messages Pref */}
                <div className="flex items-center justify-between py-3 border-b border-gray-900">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Messages</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified on direct messages or message requests.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("messages", !messagesPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      messagesPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      messagesPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Stories Pref */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Stories</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get notified when someone likes or mentions you in stories.</p>
                  </div>
                  <button
                    onClick={() => updatePreference("stories", !storiesPref)}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      storiesPref ? "bg-blue-600" : "bg-neutral-800"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      storiesPref ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: HELP & ABOUT */}
          {activeTab === "about" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
                <p className="text-xs text-gray-400 mt-1">Learn more about the platform and contact developer team.</p>
              </div>

              <div className="space-y-6">
                {/* Brand info */}
                <div className="bg-neutral-950 p-6 border border-gray-900 rounded-xl text-center space-y-4">
                  <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-gray-500">
                    Mohan Dagar
                  </h2>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                    A premium social sharing platform for high-quality visual messaging, instant group chat channels, live stories, and real-time push alerts. Build your circle with utmost trust.
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">Version 1.2.0 (Alpha)</p>
                </div>

                {/* FAQ links */}
                <div className="bg-neutral-950 border border-gray-900 rounded-xl divide-y divide-gray-900 overflow-hidden">
                  <div className="p-4 flex justify-between items-center hover:bg-neutral-900 transition-colors cursor-pointer">
                    <span className="text-xs text-gray-200 font-semibold">Privacy Policy</span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="p-4 flex justify-between items-center hover:bg-neutral-900 transition-colors cursor-pointer">
                    <span className="text-xs text-gray-200 font-semibold">Terms of Service</span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="p-4 flex justify-between items-center hover:bg-neutral-900 transition-colors cursor-pointer">
                    <span className="text-xs text-gray-200 font-semibold">Developer API Licensing</span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
