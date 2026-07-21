import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile, Post, Comment } from "../types";
import { useAuth } from "../context/AuthContext";
import { searchUsers, subscribeToFeed, toggleLikePost, addComment, subscribeToComments, deleteComment, subscribeToFollowing } from "../services/dbService";
import UsernameWithBadge from "./UsernameWithBadge";
import { motion, AnimatePresence } from "motion/react";
import { Search, Heart, MessageCircle, User, Compass, X, MoreHorizontal } from "lucide-react";
import PostOptionsMenu from "./PostOptionsMenu";

interface SearchExploreProps {
  onUserProfileClick?: (userId: string) => void;
}

export default function SearchExplore({ onUserProfileClick }: SearchExploreProps) {
  const navigate = useNavigate();
  const { profile: myProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Explore grid posts
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyToComment, setReplyToComment] = useState<{ id: string; username: string; ownerId: string } | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!myProfile?.uid) return;
    const unsub = subscribeToFollowing(myProfile.uid, (ids) => {
      setFollowingIds(ids);
    });
    return () => unsub();
  }, [myProfile?.uid]);

  // Sub to all feed posts for exploring
  useEffect(() => {
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
      setExplorePosts(filtered);
    });
    return () => unsubscribe();
  }, [myProfile, followingIds]);

  // Search logic triggers
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Sub to comments for selected post lightbox
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

  return (
    <div className="flex-1 bg-black text-white overflow-y-auto pb-20 px-4 pt-6 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search profiles on DagarChat by @username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-gray-800 rounded-lg pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
          />
        </div>

        {/* Results / Explore Feed */}
        {searchQuery.trim().length > 0 ? (
          <div className="bg-black border border-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Search Results</h3>

            {isSearching ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <User className="w-8 h-8 text-gray-700 mx-auto" />
                <p className="text-xs text-gray-500">No chat profiles matched "{searchQuery}"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/40">
                {searchResults.map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => navigate(`/${user.username}`)}
                    className="flex items-center gap-3 py-3 px-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <img
                      src={user.photoURL}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-white text-sm font-bold inline-block">
                        <UsernameWithBadge userId={user.uid} username={user.username} />
                      </div>
                      <p className="text-gray-400 text-xs">{user.fullName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard explore gallery */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Compass className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Explore Feed</h2>
            </div>

            {explorePosts.length === 0 ? (
              <div className="text-center py-24 space-y-2">
                <Compass className="w-10 h-10 text-gray-750 mx-auto" />
                <p className="text-sm text-gray-500 font-bold">Explore is empty</p>
                <p className="text-xs text-gray-600">Be the first to publish a post!</p>
              </div>
            ) : (
              /* Beautiful staggered grid */
              <div className="columns-2 md:columns-3 gap-2 space-y-2">
                {explorePosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="break-inside-avoid relative overflow-hidden rounded-lg group cursor-pointer bg-neutral-900"
                  >
                    <img
                      src={post.imageURL}
                      alt={post.caption}
                      className="w-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-[1.02]"
                      referrerPolicy="no-referrer"
                    />
                    {/* Hover Stats */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs rounded-lg">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-white text-white" />
                        {post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 fill-white text-white" />
                        {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Detail Lightbox Drawer */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row aspect-auto md:aspect-[16/10] max-h-[90vh]"
            >
              {/* Image Box */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[450px]">
                <img
                  src={selectedPost.imageURL}
                  alt={selectedPost.caption}
                  className="w-full h-full object-cover max-h-[50vh] md:max-h-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Side Comments Area */}
              <div className="w-full md:w-[380px] bg-black border-t md:border-t-0 md:border-l border-gray-800 flex flex-col h-[45vh] md:h-full">
                {/* Header user */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedPost.ownerPhotoURL}
                      alt={selectedPost.ownerUsername}
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-white text-xs font-bold">@{selectedPost.ownerUsername}</p>
                      <p className="text-white/40 text-[10px]">Active Share</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsMenuOpen(true)}
                      className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Caption & comments lists */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedPost.caption && (
                    <div className="flex items-start gap-2.5 border-b border-gray-800 pb-3">
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

                {/* Footer Controls & Forms */}
                <div className="p-4 border-t border-gray-800 bg-black">
                  <div className="flex items-center gap-3 mb-2.5">
                    <button
                      onClick={() => handleLikeClick(selectedPost)}
                      className="hover:scale-110 transition-transform cursor-pointer text-white"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          selectedPost.likes.includes(myProfile?.uid || "")
                            ? "fill-white text-white"
                            : "text-gray-400"
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
                      className="px-3 py-2 text-xs font-bold bg-white hover:bg-neutral-200 disabled:opacity-50 text-black rounded-lg transition-all cursor-pointer"
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
    </div>
  );
}
