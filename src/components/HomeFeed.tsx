import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Post, Comment } from "../types";
import { useAuth } from "../context/AuthContext";
import { subscribeToFeed, toggleLikePost, addComment, subscribeToComments, deleteComment, subscribeToFollowing } from "../services/dbService";
import StoriesSection from "./StoriesSection";
import UsernameWithBadge from "./UsernameWithBadge";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Share2, Compass, AlertCircle, Bookmark, Plus, MessageSquare, MoreHorizontal } from "lucide-react";
import PostOptionsMenu from "./PostOptionsMenu";

interface HomeFeedProps {
  onUserProfileClick?: (userId: string) => void;
  onAddStoryClick?: () => void;
  onOpenDirectChat?: (targetUserId: string) => void;
}

export default function HomeFeed({ onUserProfileClick, onAddStoryClick, onOpenDirectChat }: HomeFeedProps) {
  const navigate = useNavigate();
  const { profile: myProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!myProfile?.uid) return;
    const unsub = subscribeToFollowing(myProfile.uid, (ids) => {
      setFollowingIds(ids);
    });
    return () => unsub();
  }, [myProfile?.uid]);

  useEffect(() => {
    // Realtime subscription to post feed
    const unsubscribe = subscribeToFeed((loadedPosts) => {
      const filtered = loadedPosts.filter((post) => {
        // Filter out posts from blocked users
        if (myProfile?.blockedUsers?.includes(post.ownerId)) return false;

        // If post has no visibility or is "public", everyone can see it
        if (!post.visibility || post.visibility === "public") return true;

        // If post is "private", only the owner can see it
        if (post.visibility === "private") {
          return post.ownerId === myProfile?.uid;
        }

        // If post is "followers", only the owner OR their followers can see it
        if (post.visibility === "followers") {
          return post.ownerId === myProfile?.uid || followingIds.includes(post.ownerId);
        }

        return true;
      });
      setPosts(filtered);
    });
    return () => unsubscribe();
  }, [myProfile, followingIds]);

  const handleLike = async (post: Post) => {
    if (!myProfile) return;
    const hasLiked = post.likes.includes(myProfile.uid);
    await toggleLikePost(post.id, myProfile.uid, hasLiked);
  };

  const handleShareClick = (post: Post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setShareFeedback("Copied post share link!");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const toggleCommentsExpansion = (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
    } else {
      setExpandedCommentsPostId(postId);
    }
  };

  return (
    <div className="flex-1 bg-black text-white overflow-y-auto pb-20 select-none">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top row Stories row */}
        <StoriesSection onAddStoryClick={onAddStoryClick} />

        {shareFeedback && (
          <div className="fixed bottom-20 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-neutral-900 border border-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg z-40 flex items-center gap-1.5 shadow-2xl animate-bounce">
            <Share2 className="w-3.5 h-3.5" />
            {shareFeedback}
          </div>
        )}

        {/* Empty State when no posts exist */}
        {posts.length === 0 ? (
          <div className="text-center py-24 space-y-4 px-4">
            <div className="p-4 rounded-full bg-neutral-900 border border-gray-800 inline-block">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base">Feed is completely empty</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                No posts have been published yet. Be the absolute first to publish a visual!
              </p>
            </div>
          </div>
        ) : (
          /* List of Posts */
          <div className="space-y-6 px-4">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                myProfile={myProfile}
                onLike={() => handleLike(post)}
                onShare={() => handleShareClick(post)}
                onUserClick={() => navigate(`/@${post.ownerUsername}`)}
                onMessageClick={onOpenDirectChat}
                isExpanded={expandedCommentsPostId === post.id}
                onToggleComments={() => toggleCommentsExpansion(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Post Item Subcomponent to handle local comment fields for each individual post cleanly */
interface PostItemProps {
  post: Post;
  myProfile: any;
  onLike: () => void;
  onShare: () => void;
  onUserClick: (userId: string) => void;
  onMessageClick: (userId: string) => void;
  isExpanded: boolean;
  onToggleComments: () => void;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  myProfile,
  onLike,
  onShare,
  onUserClick,
  onMessageClick,
  isExpanded,
  onToggleComments
}) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyToComment, setReplyToComment] = useState<{ id: string; username: string; ownerId: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sub to comments for this post if expanded
  useEffect(() => {
    if (!isExpanded) return;
    const unsubscribe = subscribeToComments(post.id, (loaded) => {
      setComments(loaded);
    });
    return () => unsubscribe();
  }, [isExpanded, post.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !myProfile) return;

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
      console.error("Failed to post comment", err);
    }
  };

  const hasLiked = myProfile ? post.likes.includes(myProfile.uid) : false;

  // Format Hashtags nicely
  const formatCaption = (caption: string) => {
    if (!caption) return "";
    return caption.split(" ").map((word, i) => {
      if (word.startsWith("#")) {
        return (
          <span key={i} className="text-purple-400 font-medium">
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black border border-gray-800 rounded-lg overflow-hidden"
    >
      {/* Header user info */}
      <div className="flex items-center justify-between p-4 bg-black">
        <div className="flex items-center gap-3">
          <img
            src={post.ownerPhotoURL}
            alt={post.ownerUsername}
            onClick={() => navigate(`/@${post.ownerUsername}`)}
            className="w-8 h-8 rounded-full border border-gray-800 object-cover cursor-pointer hover:opacity-85 transition-opacity"
            referrerPolicy="no-referrer"
          />
          <div className="text-left">
            <div
              onClick={() => navigate(`/@${post.ownerUsername}`)}
              className="text-sm font-bold text-white cursor-pointer hover:text-gray-300 transition-all"
            >
              <UsernameWithBadge userId={post.ownerId} username={post.ownerUsername} />
            </div>
            <p className="text-[10px] text-gray-500">Original Post</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {myProfile && post.ownerId !== myProfile.uid && (
            <button
              onClick={() => onMessageClick(post.ownerId)}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post Photo content */}
      <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden border-t border-b border-gray-900">
        <img
          src={post.imageURL}
          alt="Shared visual"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onDoubleClick={onLike} // Double tap heart, classic Instagram style!
        />
      </div>

      {/* Actions and buttons */}
      <div className="p-4 space-y-3 bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onLike}
              className="p-1 hover:text-white transition-colors cursor-pointer hover:scale-105"
            >
              <Heart className={`w-6 h-6 ${hasLiked ? "fill-white text-white" : "text-gray-400"}`} />
            </button>

            <button
              onClick={onToggleComments}
              className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            <button
              onClick={onShare}
              className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          <button className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes Count */}
        <p className="text-sm font-bold text-white text-left">
          {post.likes?.length || 0} likes
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-300 leading-relaxed text-left">
            <span
              onClick={() => onUserClick(post.ownerId)}
              className="font-bold mr-1.5 text-white hover:text-gray-400 cursor-pointer inline-block"
            >
              <UsernameWithBadge userId={post.ownerId} username={post.ownerUsername} />
            </span>
            {formatCaption(post.caption)}
          </p>
        )}

        {/* Comment Trigger Collapse */}
        <div className="pt-1.5">
          <button
            onClick={onToggleComments}
            className="text-xs font-semibold text-gray-500 hover:text-white cursor-pointer block text-left transition-colors"
          >
            {isExpanded
              ? "Collapse Comments"
              : post.commentsCount > 0
              ? `View all ${post.commentsCount} comments...`
              : "Add a comment..."}
          </button>
        </div>

        {/* Expanded Comments Thread */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3 pt-3 border-t border-gray-900"
            >
              {/* Comment viewlist */}
              <div className="max-h-[220px] overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin">
                {comments.length === 0 ? (
                  <p className="text-[10px] text-gray-600 italic py-2 text-left">No comments on this post yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5 text-left group">
                      <img
                        src={comment.ownerPhotoURL}
                        alt={comment.ownerUsername}
                        className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-200 leading-relaxed break-words">
                          <span
                            onClick={() => navigate(`/@${comment.ownerUsername}`)}
                            className="font-bold mr-1 text-white cursor-pointer hover:text-gray-300 inline-block"
                          >
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
                          {(comment.ownerId === myProfile?.uid || post.ownerId === myProfile?.uid) && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this comment?")) {
                                  try {
                                    await deleteComment(post.id, comment.id);
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
                  ))
                )}
              </div>

              {/* Replying notice */}
              {replyToComment && (
                <div className="flex items-center justify-between bg-neutral-900 border border-gray-800 px-3 py-1.5 rounded-lg text-xs mb-1 animate-fade-in text-left">
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

              {/* Quick Post comment input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share your thoughts..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors placeholder:text-gray-600"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-xs font-bold text-black rounded-lg transition-colors cursor-pointer"
                >
                  Send
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PostOptionsMenu
        post={post}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </motion.div>
  );
}
