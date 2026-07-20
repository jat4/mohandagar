import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserProfile, Post, Comment } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToFeed,
  toggleLikePost,
  addComment,
  subscribeToComments,
  createUserProfile,
  subscribeToFollowers,
  subscribeToFollowing,
  followUser,
  unfollowUser,
  addNotification,
  checkUsernameExists,
  deleteComment,
  getUserProfileByUsername
} from "../services/dbService";
import { PROFILE_AVATARS, DEFAULT_AVATAR_URL } from "../constants";
import UsernameWithBadge from "./UsernameWithBadge";
import { motion, AnimatePresence } from "motion/react";
import {
  Grid,
  Heart,
  MessageCircle,
  Edit3,
  X,
  Save,
  LogOut,
  Check,
  Settings,
  Info,
  Calendar,
  MapPin,
  History,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Camera,
  Upload,
  Lock,
  User,
  MoreHorizontal
} from "lucide-react";
import PostOptionsMenu from "./PostOptionsMenu";

interface UserProfileViewProps {
  profileId?: string; // Optional target user ID, defaults to self
  onBackToFeed?: () => void;
  onOpenDirectChat?: (targetUserId: string) => void;
  onOpenSettings?: () => void;
  onUserProfileClick?: (userId: string) => void;
}

export default function UserProfileView({ profileId, onBackToFeed, onOpenDirectChat, onOpenSettings, onUserProfileClick }: UserProfileViewProps) {
  const { username: rawUsername } = useParams<{ username?: string }>();
  const username = rawUsername?.startsWith("@") ? rawUsername.slice(1) : rawUsername;
  const navigate = useNavigate();
  const { profile: myProfile, logOut, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [resolvingProfile, setResolvingProfile] = useState(false);

  // Modals / Detail triggers
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    loading: boolean;
  }>({ checked: true, available: true, loading: false });
  const [editError, setEditError] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyToComment, setReplyToComment] = useState<{ id: string; username: string; ownerId: string } | null>(null);
  const [showFollowsModal, setShowFollowsModal] = useState<{ type: "followers" | "following"; list: string[] } | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Followers & Following states
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Synchronize URL-based profile fetching
  useEffect(() => {
    let active = true;
    
    const loadProfileByParams = async () => {
      if (username) {
        setResolvingProfile(true);
        setUserNotFound(false);
        try {
          const fetched = await getUserProfileByUsername(username);
          if (!active) return;
          if (fetched) {
            setProfile(fetched);
            setIsOwnProfile(fetched.uid === myProfile?.uid);
            if (fetched.uid === myProfile?.uid) {
              setEditFullName(fetched.fullName || "");
              setEditBio(fetched.bio || "");
              setEditAvatar(fetched.photoURL || "");
              setEditUsername(fetched.username || "");
            }
          } else {
            setProfile(null);
            setUserNotFound(true);
          }
        } catch (err) {
          console.error("Error loading user profile", err);
          if (active) {
            setProfile(null);
            setUserNotFound(true);
          }
        } finally {
          if (active) setResolvingProfile(false);
        }
      } else {
        const targetId = profileId || myProfile?.uid;
        if (!targetId) return;

        setIsOwnProfile(targetId === myProfile?.uid);
        setResolvingProfile(true);
        setUserNotFound(false);
        try {
          if (targetId === myProfile?.uid) {
            setProfile(myProfile);
            setEditFullName(myProfile.fullName || "");
            setEditBio(myProfile.bio || "");
            setEditAvatar(myProfile.photoURL || "");
            setEditUsername(myProfile.username || "");
          } else {
            const { getUserProfile } = await import("../services/dbService");
            const p = await getUserProfile(targetId);
            if (p) {
              setProfile(p);
            } else {
              setUserNotFound(true);
            }
          }
        } catch (err) {
          console.error("Error fallback loading", err);
          setUserNotFound(true);
        } finally {
          setResolvingProfile(false);
        }
      }
    };

    loadProfileByParams();

    return () => {
      active = false;
    };
  }, [username, profileId, myProfile]);

  // Subscribe to feed and filter by user
  useEffect(() => {
    const targetId = profile?.uid;
    if (!targetId) return;

    const unsubscribe = subscribeToFeed((loadedPosts) => {
      const userPosts = loadedPosts.filter((post) => {
        if (post.ownerId !== targetId) return false;

        // If post has no visibility or is "public", everyone can see it
        if (!post.visibility || post.visibility === "public") return true;

        // If post is "private", only the owner can see it
        if (post.visibility === "private") {
          return post.ownerId === myProfile?.uid;
        }

        // If post is "followers", only the owner OR their followers can see it
        if (post.visibility === "followers") {
          const isUserFollower = myProfile ? followers.includes(myProfile.uid) : false;
          return post.ownerId === myProfile?.uid || isUserFollower;
        }

        return true;
      });
      setPosts(userPosts);
    });

    return () => unsubscribe();
  }, [profile?.uid, myProfile?.uid, followers]);

  // Subscribe to comments on active selected post lightbox
  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }
    const unsubscribe = subscribeToComments(selectedPost.id, (loadedComments) => {
      setComments(loadedComments);
    });
    return () => unsubscribe();
  }, [selectedPost]);

  // Subscribe to follower & following lists
  useEffect(() => {
    const targetId = profile?.uid;
    if (!targetId) return;

    const unsubscribeFollowers = subscribeToFollowers(targetId, (loadedFollowers) => {
      setFollowers(loadedFollowers);
    });

    const unsubscribeFollowing = subscribeToFollowing(targetId, (loadedFollowing) => {
      setFollowing(loadedFollowing);
    });

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [profile?.uid]);

  const isFollowing = myProfile ? followers.includes(myProfile.uid) : false;

  const handleFollowClick = async () => {
    if (!myProfile || !profile) return;
    try {
      if (isFollowing) {
        await unfollowUser(myProfile.uid, profile.uid);
      } else {
        await followUser(myProfile.uid, profile.uid);
        // Dispatch follower notification
        await addNotification(profile.uid, {
          userId: profile.uid,
          type: "follow",
          title: "New Follower!",
          message: `@${myProfile.username} started following you.`,
          read: false,
          senderId: myProfile.uid
        });
      }
    } catch (err) {
      console.error("Failed to toggle follow status", err);
    }
  };

  const validateUsername = (val: string) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(val);
  };

  // Debounced check for username change in modal
  useEffect(() => {
    if (!myProfile) return;
    const activeUsername = editUsername.trim().toLowerCase();

    if (!activeUsername) return;

    if (activeUsername === myProfile.username.toLowerCase()) {
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
  }, [editUsername, myProfile]);

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        setEditError("Photo size exceeds the 200KB limit.");
        return;
      }
      setEditError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myProfile) return;

    const cleanUser = editUsername.trim().toLowerCase();
    if (!validateUsername(cleanUser)) {
      setEditError("Username must be 3-20 characters and contain only letters, numbers, or underscores.");
      return;
    }

    if (!usernameStatus.available) {
      setEditError(`@${cleanUser} is taken or invalid. Please choose another username.`);
      return;
    }

    try {
      await createUserProfile(myProfile.uid, {
        username: cleanUser,
        email: myProfile.email,
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        photoURL: editAvatar,
      });

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
      setIsEditing(false);
      // Wait for a second for the context state to update, or force local profile update
      setProfile((prev) => prev ? { ...prev, username: cleanUser, fullName: editFullName, bio: editBio, photoURL: editAvatar } : null);
    } catch (err) {
      console.error("Failed to update profile", err);
      setEditError("Failed to update profile. Please try again.");
    }
  };

  const handleLikeClick = async (post: Post) => {
    if (!myProfile) return;
    const hasLiked = post.likes.includes(myProfile.uid);
    await toggleLikePost(post.id, myProfile.uid, hasLiked);
    // update local state
    setSelectedPost((prev) => {
      if (prev?.id === post.id) {
        const updatedLikes = hasLiked
          ? prev.likes.filter((id) => id !== myProfile.uid)
          : [...prev.likes, myProfile.uid];
        return {
          ...prev,
          likes: updatedLikes,
          likesCount: hasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        };
      }
      return prev;
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myProfile || !selectedPost || !commentInput.trim()) return;

    try {
      await addComment(selectedPost.id, {
        postId: selectedPost.id,
        ownerId: myProfile.uid,
        ownerUsername: myProfile.username,
        ownerPhotoURL: myProfile.photoURL,
        text: commentInput.trim(),
        replyToCommentId: replyToComment?.id || undefined,
        replyToUsername: replyToComment?.username || undefined,
        replyToCommentOwnerId: replyToComment?.ownerId || undefined
      });
      setCommentInput("");
      setReplyToComment(null);
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleBlockToggle = async () => {
    if (!myProfile || !profile) return;
    const isBlocked = myProfile.blockedUsers?.includes(profile.uid) || false;
    let updatedBlocked = myProfile.blockedUsers || [];
    if (isBlocked) {
      updatedBlocked = updatedBlocked.filter(uid => uid !== profile.uid);
    } else {
      updatedBlocked = [...updatedBlocked, profile.uid];
      try {
        await unfollowUser(myProfile.uid, profile.uid);
        await unfollowUser(profile.uid, myProfile.uid);
      } catch (err) {
        console.error("Failed to unfollow mutually on block:", err);
      }
    }

    try {
      await createUserProfile(myProfile.uid, {
        ...myProfile,
        blockedUsers: updatedBlocked
      });
      await refreshProfile();
    } catch (err) {
      console.error("Failed to toggle block:", err);
    }
  };

  if (userNotFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-white p-8 text-center min-h-screen">
        <div className="bg-neutral-900 border border-gray-800 p-4 rounded-full mb-6">
          <User className="w-12 h-12 text-gray-500 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black mb-2">User Not Found</h1>
        <p className="text-gray-400 max-w-sm text-xs leading-relaxed mb-6">
          The profile {username} could not be resolved in the Mohan Dagar registry database.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-neutral-200 transition-colors"
        >
          Back to Home Feed
        </button>
      </div>
    );
  }

  if (resolvingProfile || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-gray-500 min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black text-white overflow-y-auto pb-20 select-none">
      {/* Profile Header Block */}
      <div className="max-w-4xl mx-auto px-4 py-8 border-b border-gray-900">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Avatar Area */}
          <div className="relative">
            <img
              src={profile.photoURL}
              alt={profile.username}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-gray-800 object-cover p-1"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* User Meta & Bio */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight inline-flex items-center">
                <UsernameWithBadge userId={profile.uid} username={profile.username} badgeClassName="w-5 h-5" showAtPrefix={false} />
              </h2>

              {isOwnProfile ? (
                <div className="flex gap-2 items-center flex-wrap justify-center sm:justify-start">
                  <button
                    onClick={() => {
                      if (onOpenSettings) {
                        onOpenSettings();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-gray-800 rounded-lg text-gray-200 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-white" />
                    Edit Profile
                  </button>
                  {onOpenSettings && (
                    <button
                      onClick={onOpenSettings}
                      className="p-2 text-gray-400 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-gray-800 rounded-lg transition-colors cursor-pointer"
                      title="Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-gray-800 rounded-lg text-gray-300 transition-colors cursor-pointer"
                    title="About This Account"
                  >
                    <Info className="w-3.5 h-3.5" />
                    About
                  </button>
                  <button
                    onClick={logOut}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 rounded-lg text-red-350 transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center justify-center sm:justify-start">
                  <button
                    onClick={handleFollowClick}
                    className={`flex items-center gap-1 px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isFollowing
                        ? "bg-neutral-900 hover:bg-neutral-850 border border-gray-800 text-white"
                        : "bg-white hover:bg-neutral-200 text-black shadow-lg"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        {myProfile && following.includes(myProfile.uid) ? "Follow Back" : "Follow"}
                      </>
                    )}
                  </button>
                  {onOpenDirectChat && (
                    <button
                      onClick={() => onOpenDirectChat(profile.uid)}
                      className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-850 border border-gray-850 text-white rounded-lg transition-all cursor-pointer"
                    >
                      Message
                    </button>
                  )}
                  <button
                    onClick={handleBlockToggle}
                    className={`px-4 py-2 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                      myProfile?.blockedUsers?.includes(profile.uid)
                        ? "bg-red-600/20 hover:bg-red-600/35 border-red-500/50 text-red-400"
                        : "bg-neutral-900 hover:bg-neutral-850 border-gray-800 text-red-500 hover:text-red-400"
                    }`}
                  >
                    {myProfile?.blockedUsers?.includes(profile.uid) ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="p-2 text-gray-400 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-gray-800 rounded-lg transition-colors cursor-pointer"
                    title="About This Account"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Counters */}
            <div className="flex justify-center md:justify-start gap-8 border-t border-b border-gray-900 py-2.5 sm:border-0 sm:py-0 select-none">
              <div className="text-center sm:text-left">
                <span className="font-bold text-white block sm:inline mr-1">{posts.length}</span>
                <span className="text-gray-400 text-sm">posts</span>
              </div>
              <div
                onClick={() => {
                  const allowed = isOwnProfile || !profile.isPrivate || isFollowing;
                  if (allowed) {
                    setShowFollowsModal({ type: "followers", list: followers });
                  }
                }}
                className={`text-center sm:text-left ${
                  isOwnProfile || !profile.isPrivate || isFollowing
                    ? "cursor-pointer hover:underline"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="font-bold text-white block sm:inline mr-1">
                  {followers.length}
                </span>
                <span className="text-gray-400 text-sm">followers</span>
              </div>
              <div
                onClick={() => {
                  const allowed = isOwnProfile || !profile.isPrivate || isFollowing;
                  if (allowed) {
                    setShowFollowsModal({ type: "following", list: following });
                  }
                }}
                className={`text-center sm:text-left ${
                  isOwnProfile || !profile.isPrivate || isFollowing
                    ? "cursor-pointer hover:underline"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="font-bold text-white block sm:inline mr-1">
                  {following.length}
                </span>
                <span className="text-gray-400 text-sm">following</span>
              </div>
            </div>

            {/* Full Name & Biography */}
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">{profile.fullName}</h3>
              <p className="text-gray-400 text-sm whitespace-pre-line leading-relaxed">{profile.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Feed Tab Header */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex justify-center border-b border-gray-900 pb-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-widest border-b-2 border-white pb-3.5 px-2">
            <Grid className="w-4 h-4" />
            Posts
          </span>
        </div>

        {/* Posts Grid Layout */}
        {!isOwnProfile && profile.isPrivate && !isFollowing ? (
          <div className="text-center py-24 space-y-4 max-w-sm mx-auto mt-6">
            <div className="w-16 h-16 rounded-full border border-gray-800 flex items-center justify-center mx-auto bg-neutral-950">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg">This Account is Private</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Follow this account to see their photos, videos, and dynamic chats.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Grid className="w-10 h-10 text-gray-700 mx-auto" />
            <h3 className="text-gray-400 font-bold">No Posts Yet</h3>
            <p className="text-xs text-gray-600">Start sharing your premium chats and visuals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-4 mt-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square bg-neutral-950 overflow-hidden group cursor-pointer border border-neutral-900 rounded-lg"
              >
                <img
                  src={post.imageURL}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Hover overlay stats */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white text-white" />
                    {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white text-white" />
                    {post.commentsCount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers / Following List Modal */}
      <AnimatePresence>
        {showFollowsModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border border-gray-950 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[450px]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-900 bg-neutral-950">
                <h3 className="font-bold text-white capitalize text-sm">
                  {showFollowsModal.type}
                </h3>
                <button
                  onClick={() => setShowFollowsModal(null)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {showFollowsModal.list.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-6">
                    No {showFollowsModal.type} yet.
                  </p>
                ) : (
                  showFollowsModal.list.map((uid) => (
                    <FollowUserItem
                      key={uid}
                      userId={uid}
                      onClose={() => setShowFollowsModal(null)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-900 bg-black">
                <h3 className="text-white font-bold text-base">Edit Profile Settings</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditProfileSubmit} className="p-6 space-y-4">
                {/* Profile Photo File Upload */}
                <div className="flex items-center gap-4 bg-neutral-950 p-3.5 border border-gray-900 rounded-xl">
                  <img
                    src={editAvatar || DEFAULT_AVATAR_URL}
                    alt="Edit Profile Photo"
                    className="w-14 h-14 rounded-full border border-gray-800 object-cover bg-neutral-900"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex gap-2">
                      <label className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-[11px] text-gray-300 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all font-semibold">
                        <Upload className="w-3 h-3" />
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handleEditPhotoUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditAvatar(DEFAULT_AVATAR_URL)}
                        className="inline-flex items-center gap-1 bg-red-950/25 hover:bg-red-950/40 border border-red-900/40 text-[11px] text-red-400 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all font-semibold"
                      >
                        Remove Photo
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-500">Max size: 200KB</p>
                  </div>
                </div>

                {/* Username Input Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                      className="w-full bg-neutral-900 border border-gray-800 rounded-lg pl-7 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      required
                    />
                  </div>
                  {editUsername && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {usernameStatus.loading && (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {usernameStatus.checked && !usernameStatus.loading && (
                        <p className={`text-xs ${usernameStatus.available ? "text-green-400" : "text-red-405"}`}>
                          {usernameStatus.available
                            ? `@${editUsername} is available!`
                            : `@${editUsername} is taken or invalid.`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-800 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-white transition-all resize-none"
                    placeholder="Tell us about yourself..."
                    maxLength={300}
                  />
                </div>

                {editError && (
                  <p className="text-xs text-red-500 font-semibold">{editError}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-white hover:bg-neutral-200 text-black font-bold rounded-lg py-3.5 mt-2 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Lightbox Detail Screen */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row aspect-auto md:aspect-[16/10] max-h-[90vh]"
            >
              {/* Left Column: Post Image */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[450px]">
                <img
                  src={selectedPost.imageURL}
                  alt={selectedPost.caption}
                  className="w-full h-full object-cover max-h-[50vh] md:max-h-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Column: User details, comments, actions */}
              <div className="w-full md:w-[380px] bg-black border-t md:border-t-0 md:border-l border-gray-900 flex flex-col h-[45vh] md:h-full">
                {/* Header User info */}
                <div className="flex items-center justify-between p-4 border-b border-gray-900 bg-black">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedPost.ownerPhotoURL}
                      alt={selectedPost.ownerUsername}
                      className="w-8 h-8 rounded-full object-cover border border-gray-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-white text-xs font-bold inline-block">
                        <UsernameWithBadge userId={selectedPost.ownerId} username={selectedPost.ownerUsername} />
                      </div>
                      <p className="text-white/40 text-[10px]">Active Share</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsMenuOpen(true)}
                      className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Caption + Scrollable Comments area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Caption */}
                  {selectedPost.caption && (
                    <div className="flex items-start gap-2.5 border-b border-gray-900 pb-3">
                      <img
                        src={selectedPost.ownerPhotoURL}
                        alt={selectedPost.ownerUsername}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-xs font-bold mr-1.5 text-white inline-block">
                          <UsernameWithBadge userId={selectedPost.ownerId} username={selectedPost.ownerUsername} />
                        </span>
                        <span className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{selectedPost.caption}</span>
                      </div>
                    </div>
                  )}

                  {/* Comments list */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2.5 group text-left">
                        <img
                          src={comment.ownerPhotoURL}
                          alt={comment.ownerUsername}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white break-words leading-relaxed">
                            <span className="font-bold mr-1.5 inline-block text-white">
                              <UsernameWithBadge userId={comment.ownerId} username={comment.ownerUsername} />
                            </span>
                            {comment.replyToUsername && (
                              <span className="text-purple-400 font-semibold mr-1.5">
                                @{comment.replyToUsername}
                              </span>
                            )}
                            {comment.text}
                          </p>
                          <div className="flex items-center gap-3 mt-1 select-none">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyToComment({
                                  id: comment.id,
                                  username: comment.ownerUsername,
                                  ownerId: comment.ownerId
                                });
                              }}
                              className="text-[9px] font-bold text-gray-500 hover:text-white transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                            {(comment.ownerId === myProfile?.uid || selectedPost.ownerId === myProfile?.uid) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this comment?")) {
                                    try {
                                      await deleteComment(selectedPost.id, comment.id);
                                    } catch (err) {
                                      console.error("Failed to delete comment:", err);
                                    }
                                  }
                                }}
                                className="text-[9px] font-bold text-gray-500 hover:text-red-500 transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions & Input Form */}
                <div className="p-4 border-t border-gray-900 bg-black">
                  <div className="flex items-center gap-3 mb-2.5">
                    <button
                      onClick={() => handleLikeClick(selectedPost)}
                      className="hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          selectedPost.likes.includes(myProfile?.uid || "")
                            ? "fill-white text-white"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-gray-200">
                      {selectedPost.likes?.length || 0} likes
                    </span>
                  </div>

                  {/* Replying notice */}
                  {replyToComment && (
                    <div className="flex items-center justify-between bg-neutral-900 border border-gray-800 px-3 py-1.5 rounded-lg text-xs mb-2.5 animate-fade-in text-left">
                      <span className="text-gray-400">
                        Replying to <span className="text-purple-400 font-bold">@{replyToComment.username}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyToComment(null)}
                        className="text-gray-500 hover:text-white transition-colors cursor-pointer text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* In-line comment input form */}
                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-3 py-2 text-xs font-bold bg-white hover:bg-neutral-200 text-black rounded-lg transition-all cursor-pointer"
                    >
                      Post
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedPost && (
        <PostOptionsMenu
          post={selectedPost}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onDeleteSuccess={() => {
            setSelectedPost(null);
          }}
        />
      )}

      {/* About This Account Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-900 bg-black">
                <span className="text-white text-sm font-extrabold tracking-tight">About This Account</span>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Content body */}
              <div className="p-6 space-y-6 text-left">
                {/* Profile mini avatar */}
                <div className="flex flex-col items-center text-center space-y-2 pb-2">
                  <img
                    src={profile.photoURL}
                    alt={profile.username}
                    className="w-16 h-16 rounded-full object-cover border border-gray-800 p-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white inline-flex items-center gap-1">
                      <UsernameWithBadge userId={profile.uid} username={profile.username} badgeClassName="w-4 h-4" />
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{profile.username}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed text-center pb-2 border-b border-gray-900">
                  To help keep our community authentic, we show information about accounts on Mohan Dagar.
                </p>

                {/* Details list */}
                <div className="space-y-4.5 bg-black/40 p-4 rounded-xl border border-gray-900">
                  <div className="flex items-start gap-3.5">
                    <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Date joined</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {profile.createdAt?.seconds
                          ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                          : profile.createdAt instanceof Date
                          ? profile.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                          : typeof profile.createdAt === "string" && !isNaN(Date.parse(profile.createdAt))
                          ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                          : "July 2026"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Account location</p>
                      <p className="text-sm font-semibold text-white mt-0.5">India (Primary)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <History className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Former usernames</p>
                      <p className="text-sm font-semibold text-white mt-0.5">None</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Verified status</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {profile.isVerified ? "Verified (Active Badge)" : "Not Verified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="p-4 border-t border-gray-900 bg-black text-center">
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="w-full py-2.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-850 border border-gray-800 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FollowUserItem: React.FC<{
  userId: string;
  onClose: () => void;
}> = ({ userId, onClose }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { getUserProfile } = await import("../services/dbService");
        const profileData = await getUserProfile(userId);
        if (active) {
          setUser(profileData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-neutral-900" />
        <div className="flex-1 space-y-1.5">
          <div className="w-24 h-3 bg-neutral-900 rounded animate-pulse" />
          <div className="w-16 h-2.5 bg-neutral-900 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-900/50 last:border-b-0">
      <div
        onClick={() => {
          navigate(`/${user.username}`);
          onClose();
        }}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <img
          src={user.photoURL}
          alt={user.username}
          className="w-9 h-9 rounded-full object-cover border border-gray-800"
          referrerPolicy="no-referrer"
        />
        <div className="text-left">
          <div className="flex items-center gap-1 font-bold text-sm text-white group-hover:text-gray-300 transition-colors">
            <UsernameWithBadge userId={user.uid} username={user.username} />
          </div>
          <div className="text-[10px] text-gray-500">{user.fullName}</div>
        </div>
      </div>
    </div>
  );
};
