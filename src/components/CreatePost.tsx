import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPost, createStory } from "../services/dbService";
import { PRESET_IMAGES } from "../constants";
import { motion } from "motion/react";
import { X, Image, Sparkles, Send, FileImage, Layers } from "lucide-react";

interface CreatePostProps {
  onClose: () => void;
  defaultType?: "post" | "story";
}

export default function CreatePost({ onClose, defaultType = "post" }: CreatePostProps) {
  const { profile } = useAuth();
  const [contentType, setContentType] = useState<"post" | "story">(defaultType);
  const [caption, setCaption] = useState("");
  const [imageURL, setImageURL] = useState(PRESET_IMAGES[0].url);
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_IMAGES[0].id);
  const [customURLMode, setCustomURLMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = (id: string, url: string) => {
    setSelectedPresetId(id);
    setImageURL(url);
    setCustomURLMode(false);
  };

  const handleCustomURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageURL(e.target.value);
    setSelectedPresetId("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        setError("File size exceeds the 200KB limit. Please choose a smaller photo.");
        return;
      }
      setError(null);
      // Create a local object URL or data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageURL(reader.result);
          setSelectedPresetId("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!imageURL.trim()) {
      setError("Please provide an image for your post or story.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (contentType === "post") {
        await createPost({
          ownerId: profile.uid,
          ownerUsername: profile.username,
          ownerPhotoURL: profile.photoURL,
          imageURL: imageURL.trim(),
          caption: caption.trim()
        });
      } else {
        await createStory({
          ownerId: profile.uid,
          ownerUsername: profile.username,
          ownerPhotoURL: profile.photoURL,
          imageURL: imageURL.trim(),
          caption: caption.trim() || undefined
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to publish. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0d0f17] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#131622]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold text-lg">Create New Share</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Toggle Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Share Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContentType("post")}
                className={`py-3 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  contentType === "post"
                    ? "bg-purple-600/10 border-purple-500 text-purple-300"
                    : "bg-transparent border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                <Layers className="w-4 h-4" />
                Feed Post
              </button>
              <button
                type="button"
                onClick={() => setContentType("story")}
                className={`py-3 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  contentType === "story"
                    ? "bg-purple-600/10 border-purple-500 text-purple-300"
                    : "bg-transparent border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                <Layers className="w-4 h-4" />
                Active Story
              </button>
            </div>
          </div>

          {/* Core Layout Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Image Selection & Preview */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Media Content
              </label>

              {/* Preview Box */}
              <div className="aspect-square bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
                {imageURL ? (
                  <img src={imageURL} alt="Share preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Image className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Select or upload media to preview</p>
                  </div>
                )}
              </div>

              {/* Custom URL Input Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomURLMode(!customURLMode)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    customURLMode
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-transparent border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  Custom Link URL
                </button>

                <label className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-800 text-gray-400 hover:border-gray-700 transition-all cursor-pointer flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5" />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <p className="text-[10px] text-gray-500">Supported formats: JPEG, PNG, WEBP. Max size: 200KB.</p>

              {customURLMode && (
                <input
                  type="url"
                  placeholder="Paste direct photo link..."
                  value={imageURL}
                  onChange={handleCustomURLChange}
                  className="w-full bg-[#1b1e2e] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                />
              )}
            </div>

            {/* Right: Caption & Preset Selection */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Share Caption / Overlay Text
                </label>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    contentType === "post"
                      ? "Write a creative caption... use #hashtags"
                      : "Add story message text overlay..."
                  }
                  className="w-full bg-[#141624] border border-gray-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all resize-none"
                  maxLength={1000}
                />
              </div>

              {/* Preset Gallery */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Aesthetic Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id, preset.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPresetId === preset.id
                          ? "border-purple-500 scale-95"
                          : "border-transparent hover:border-gray-700"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1.5">
                        <span className="text-[10px] text-white/90 font-medium truncate w-full">
                          {preset.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !imageURL}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 disabled:opacity-50 text-white font-semibold rounded-2xl py-4 mt-4 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-xl shadow-purple-950/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish to {contentType === "post" ? "Feed" : "Stories"}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
