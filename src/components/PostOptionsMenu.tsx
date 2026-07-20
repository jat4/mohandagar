import React, { useState } from "react";
import { Post, PostReport } from "../types";
import { useAuth } from "../context/AuthContext";
import { deletePost, createPostReport } from "../services/dbService";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Copy, Link, Share2, ShieldAlert } from "lucide-react";

interface PostOptionsMenuProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess?: () => void;
}

type MenuMode = "main" | "confirm-delete" | "report-reasons" | "report-details" | "report-success";

const REPORT_REASONS = [
  "Spam",
  "Nudity or sexual activity",
  "Hate speech or symbols",
  "Violence or dangerous organizations",
  "Bullying or harassment",
  "Intellectual property violation",
  "False information",
  "Something else"
];

export default function PostOptionsMenu({ post, isOpen, onClose, onDeleteSuccess }: PostOptionsMenuProps) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<MenuMode>("main");
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (!isOpen) return null;

  const isOwner = profile?.uid === post.ownerId;

  // Handles copying the post link to clipboard
  const handleCopyLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      showToast("Link copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy link.");
    }
  };

  // Handles simple sharing
  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${post.ownerUsername}'s Post on Mohan Dagar`,
          text: post.caption || "Check out this post!",
          url: postUrl
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Handles deleting the post permanently
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deletePost(post.id);
      showToast("Post deleted successfully!");
      setTimeout(() => {
        onClose();
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      }, 800);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete post.");
    } finally {
      setLoading(false);
    }
  };

  // Handles submitting a new post report to the DB
  const handleReportSubmit = async () => {
    if (!selectedReason) return;
    setLoading(true);
    try {
      await createPostReport({
        postId: post.id,
        postOwnerId: post.ownerId,
        postOwnerUsername: post.ownerUsername,
        reporterId: profile?.uid || "guest",
        reporterUsername: profile?.username || "guest_user",
        reason: selectedReason,
        additionalDetails: additionalDetails.trim() || undefined
      });
      setMode("report-success");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
      />

      {/* Floating Action Menu Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="relative z-10 w-full max-w-sm bg-[#262626] text-white rounded-xl shadow-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 text-center"
      >
        <AnimatePresence mode="wait">
          {/* 1. Main Options Menu */}
          {mode === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              {isOwner ? (
                <button
                  onClick={() => setMode("confirm-delete")}
                  className="w-full py-3.5 text-red-500 font-bold hover:bg-zinc-800/50 transition-colors cursor-pointer text-sm"
                >
                  Delete Post
                </button>
              ) : (
                <button
                  onClick={() => setMode("report-reasons")}
                  className="w-full py-3.5 text-red-500 font-bold hover:bg-zinc-800/50 transition-colors cursor-pointer text-sm"
                >
                  Report
                </button>
              )}

              <button
                onClick={handleCopyLink}
                className="w-full py-3.5 text-white font-medium hover:bg-zinc-800/50 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Link className="w-4 h-4 text-zinc-400" />
                Copy Link
              </button>

              <button
                onClick={handleShare}
                className="w-full py-3.5 text-white font-medium hover:bg-zinc-800/50 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 text-zinc-400" />
                Share
              </button>

              <button
                onClick={onClose}
                className="w-full py-3.5 text-zinc-400 hover:bg-zinc-800/50 transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* 2. Delete Confirmation Dialog */}
          {mode === "confirm-delete" && (
            <motion.div
              key="confirm-delete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 mb-1">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Post?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                Are you sure you want to permanently delete this post? This will remove all associated comments, likes, notifications, and reports. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full mt-4">
                <button
                  disabled={loading}
                  onClick={() => setMode("main")}
                  className="flex-1 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer text-zinc-300"
                >
                  Go Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleDelete}
                  className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. Report Reasons list */}
          {mode === "report-reasons" && (
            <motion.div
              key="report-reasons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col text-left"
            >
              <div className="p-4 border-b border-zinc-800 text-center">
                <h3 className="text-sm font-bold text-white">Report</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Why are you reporting this post?</p>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/40">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedReason(reason);
                      setMode("report-details");
                    }}
                    className="w-full text-left py-3 px-5 text-xs text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMode("main")}
                className="w-full py-3.5 text-center text-xs text-zinc-400 border-t border-zinc-800 hover:bg-zinc-800/50 cursor-pointer font-semibold"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* 4. Report details form */}
          {mode === "report-details" && (
            <motion.div
              key="report-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 flex flex-col text-left gap-3.5"
            >
              <div className="flex items-center gap-2 text-zinc-400">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-white">Reason: {selectedReason}</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                  Additional Details
                </label>
                <textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Provide any additional context to assist the moderators (optional)..."
                  rows={4}
                  className="w-full bg-[#121212] border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-3 mt-1.5">
                <button
                  disabled={loading}
                  onClick={() => setMode("report-reasons")}
                  className="flex-1 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer text-zinc-300 text-center"
                >
                  Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleReportSubmit}
                  className="flex-1 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 5. Report Success confirmation */}
          {mode === "report-success" && (
            <motion.div
              key="report-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 mb-1 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Thank You!</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                Your report has been securely saved and sent to the Admin Dashboard. An administrator will manually review this post. We appreciate your help in keeping Mohan Dagar safe!
              </p>
              <button
                onClick={onClose}
                className="w-full mt-4 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Toast Notification inside Modal */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 z-50 bg-[#1a1a1a] border border-zinc-800 px-4 py-2 rounded-lg text-xs text-white font-semibold flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
