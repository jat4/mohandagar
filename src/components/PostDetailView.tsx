import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToFeed,
  toggleLikePost,
  addComment,
  subscribeToComments,
  deleteComment,
  getUserProfile,
  addNotification
} from "../services/dbService";
import { Post, Comment, UserProfile } from "../types";
import UsernameWithBadge from "./UsernameWithBadge";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  Trash2,
  CornerDownRight,
  Send,
  X,
  UserPlus,
  UserMinus,
  Sparkles,
  Smile,
  MoreHorizontal
} from "lucide-react";
import PostOptionsMenu from "./PostOptionsMenu";

export default function PostDetailView() {
  const { postId } = useParams<{ postId: string }>();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyToComment, setReplyToComment] = useState<{ id: string; username: string; ownerId: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Likes list sub-view
  const [likesList, setLikesList] = useState<UserProfile[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // Active view: "comments" or "likes" based on URL path or state
  const isLikesTab = location.pathname.endsWith("/likes");
  const isCommentsTab = location.pathname.endsWith("/comments") || (!isLikesTab);

  // 1. Subscribe to the feed to get this specific post in real-time
  useEffect(() => {
    if (!postId) return;
    setLoading(true);

    const unsubscribe = subscribeToFeed((loadedPosts) => {
      const found = loadedPosts.find((p) => p.id === postId);
      if (found) {
        setPost(found);
      } else {
        setPost(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // 2. Subscribe to comments for this post
  useEffect(() => {
    if (!postId || !post) return;

    const unsubscribe = subscribeToComments(postId, (loadedComments) => {
      setComments(loadedComments);
    });

    return () => unsubscribe();
  }, [postId, post]);

  // 3. Load user profiles of people who liked the post when likes tab is open
  useEffect(() => {
    if (!post || !isLikesTab) return;

    const fetchLikesProfiles = async () => {
      setLoadingLikes(true);
      try {
        const profiles: UserProfile[] = [];
        for (const uid of post.likes || []) {
          const uProfile = await getUserProfile(uid);
          if (uProfile) {
            profiles.push(uProfile);
          }
        }
        setLikesList(profiles);
      } catch (err) {
        console.error("Failed to load likes profiles:", err);
      } finally {
        setLoadingLikes(false);
      }
    };

    fetchLikesProfiles();
  }, [post?.likes, isLikesTab]);

  const handleLike = async () => {
    if (!post || !myProfile) return;
    const hasLiked = post.likes?.includes(myProfile.uid) || false;
    try {
      await toggleLikePost(post.id, myProfile.uid, hasLiked);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentInput.trim() || !myProfile) return;

    try {
      await addComment(post.id, {
        postId: post.id,
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
      console.error("Failed to post comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(post.id, commentId);
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Post link copied to clipboard! Share it anywhere.");
  };

  // Format Hashtags nicely
  const formatCaption = (caption: string) => {
    if (!caption) return "";
    return caption.split(" ").map((word, i) => {
      if (word.startsWith("#")) {
        return (
          <span key={i} className="text-purple-400 font-medium cursor-pointer hover:underline">
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black min-h-screen text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full"
        />
        <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase mt-4 animate-pulse">
          Synchronizing Post Detail...
        </span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black min-h-screen text-white">
        <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-4">
          <X className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
        <p className="text-gray-400 max-w-md text-sm mb-6">
          This post might have been deleted by the owner or is unavailable under your visibility configuration.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-white text-black font-extrabold text-sm rounded-lg hover:bg-neutral-200 transition-all cursor-pointer"
        >
          Return to Home Feed
        </button>
      </div>
    );
  }

  const hasLiked = myProfile ? post.likes.includes(myProfile.uid) : false;

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="border-b border-gray-900 bg-neutral-950 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-xs font-bold"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <span className="text-xs font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-gray-500">
          Post Details
        </span>
        <div className="w-10"></div> {/* balancing spacer */}
      </div>

      {/* Main split viewport layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Interactive Photo Visual */}
        <div className="flex-1 bg-black flex items-center justify-center relative border-b lg:border-b-0 lg:border-r border-gray-950 overflow-hidden group">
          <img
            src={post.imageURL}
            alt="Post content visualization"
            className="w-full h-full max-h-[40vh] lg:max-h-full object-contain"
            referrerPolicy="no-referrer"
            onDoubleClick={handleLike}
          />
          {/* Subtle double-tap feedback heart overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-active:opacity-80 transition-opacity">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
          </div>
        </div>

        {/* Right Side: Navigation panel containing Author, comments, and likes tabs */}
        <div className="w-full lg:w-[480px] flex flex-col bg-neutral-950 shrink-0 overflow-hidden">
          {/* Section A: Author Profile Card */}
          <div className="p-4 border-b border-gray-900 flex items-center justify-between bg-black">
            <div className="flex items-center gap-3">
              <img
                src={post.ownerPhotoURL}
                alt={post.ownerUsername}
                onClick={() => navigate(`/${post.ownerUsername}`)}
                className="w-10 h-10 rounded-full border border-gray-800 object-cover cursor-pointer hover:opacity-90 transition-all"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <div
                  onClick={() => navigate(`/${post.ownerUsername}`)}
                  className="text-sm font-black text-white hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <UsernameWithBadge userId={post.ownerId} username={post.ownerUsername} />
                </div>
                <p className="text-[10px] text-gray-500">Original Creator</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {myProfile && post.ownerId !== myProfile.uid && (
                <button
                  onClick={() => navigate("/messages", { state: { directUserId: post.ownerId } })}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white"
                >
                  Message
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section B: Custom Tab Selector Header */}
          <div className="flex border-b border-gray-900 bg-neutral-950 shrink-0">
            <button
              onClick={() => navigate(`/post/${post.id}/comments`)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                isCommentsTab
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => navigate(`/post/${post.id}/likes`)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                isLikesTab
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Likes ({post.likes?.length || 0})
            </button>
          </div>

          {/* Section C: Live Dynamic Container Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isCommentsTab && (
              <div className="space-y-4">
                {/* Render the post description as the first comment */}
                {post.caption && (
                  <div className="flex items-start gap-3 border-b border-gray-900 pb-4">
                    <img
                      src={post.ownerPhotoURL}
                      alt={post.ownerUsername}
                      onClick={() => navigate(`/${post.ownerUsername}`)}
                      className="w-8 h-8 rounded-full border border-gray-800 object-cover cursor-pointer"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left flex-1">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        <span
                          onClick={() => navigate(`/${post.ownerUsername}`)}
                          className="font-bold text-white hover:underline cursor-pointer mr-1.5"
                        >
                          {post.ownerUsername}
                        </span>
                        {formatCaption(post.caption)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actual comments loop */}
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 space-y-2">
                    <MessageCircle className="w-8 h-8 mx-auto opacity-40 text-gray-500" />
                    <p className="text-xs italic">No comments on this post yet.</p>
                    <p className="text-[10px]">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 group text-left">
                      <img
                        src={comment.ownerPhotoURL}
                        alt={comment.ownerUsername}
                        onClick={() => navigate(`/${comment.ownerUsername}`)}
                        className="w-8 h-8 rounded-full border border-gray-800 object-cover cursor-pointer shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 bg-neutral-900/30 p-2.5 rounded-xl border border-gray-900/40 hover:border-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <span
                            onClick={() => navigate(`/${comment.ownerUsername}`)}
                            className="text-xs font-bold text-white hover:underline cursor-pointer"
                          >
                            <UsernameWithBadge userId={comment.ownerId} username={comment.ownerUsername} />
                          </span>
                          
                          {/* Options / Delete Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                setReplyToComment({
                                  id: comment.id,
                                  username: comment.ownerUsername,
                                  ownerId: comment.ownerId
                                })
                              }
                              className="text-[10px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                            {(comment.ownerId === myProfile?.uid || post.ownerId === myProfile?.uid) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-[10px] text-red-500 hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          {comment.replyToUsername && (
                            <span className="text-purple-400 font-bold mr-1.5">
                              @{comment.replyToUsername}
                            </span>
                          )}
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {isLikesTab && (
              <div className="space-y-3.5">
                {loadingLikes ? (
                  <p className="text-xs text-gray-500 italic text-center py-8 animate-pulse">Loading list of likes...</p>
                ) : likesList.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 space-y-2">
                    <Heart className="w-8 h-8 mx-auto opacity-40 text-gray-500" />
                    <p className="text-xs italic">No likes on this post yet.</p>
                  </div>
                ) : (
                  likesList.map((liker) => (
                    <div
                      key={liker.uid}
                      onClick={() => navigate(`/${liker.username}`)}
                      className="flex items-center justify-between bg-neutral-900/40 hover:bg-neutral-900 p-2.5 border border-gray-900 hover:border-gray-850 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={liker.photoURL}
                          alt={liker.username}
                          className="w-9 h-9 rounded-full object-cover border border-gray-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white flex items-center gap-1">
                            <UsernameWithBadge userId={liker.uid} username={liker.username} />
                          </p>
                          <p className="text-[10px] text-gray-500">{liker.fullName}</p>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-600 rotate-180" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Section D: Direct Interactions & Actions */}
          <div className="p-4 border-t border-gray-900 bg-black shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className="p-1 hover:text-white transition-colors cursor-pointer hover:scale-105"
                >
                  <Heart className={`w-6 h-6 ${hasLiked ? "fill-white text-white" : "text-gray-400"}`} />
                </button>
                <button
                  onClick={() => navigate(`/post/${post.id}/comments`)}
                  className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              <button className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs font-black text-white text-left">
              {post.likes?.length || 0} likes
            </p>

            {/* Input Form specifically for posting comments */}
            {myProfile && isCommentsTab && (
              <form onSubmit={handlePostComment} className="space-y-2 pt-1 border-t border-gray-950">
                {replyToComment && (
                  <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg text-[10px] text-purple-300">
                    <span>
                      Replying to <strong className="text-white">@{replyToComment.username}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyToComment(null)}
                      className="text-gray-500 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a public comment..."
                    className="flex-1 bg-neutral-900 border border-gray-800 focus:border-white focus:outline-none rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="p-2 bg-white disabled:opacity-40 text-black hover:bg-neutral-200 transition-colors rounded-lg cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <PostOptionsMenu
        post={post}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onDeleteSuccess={() => navigate("/")}
      />
    </div>
  );
}
