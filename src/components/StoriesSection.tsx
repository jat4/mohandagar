import React, { useState, useEffect } from "react";
import { Story } from "../types";
import { useAuth } from "../context/AuthContext";
import { subscribeToStories } from "../services/dbService";
import UsernameWithBadge from "./UsernameWithBadge";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

interface StoriesSectionProps {
  onAddStoryClick: () => void;
}

export default function StoriesSection({ onAddStoryClick }: StoriesSectionProps) {
  const { profile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Realtime subscription to stories
    const unsubscribe = subscribeToStories((loadedStories) => {
      setStories(loadedStories);
    });
    return () => unsubscribe();
  }, []);

  // Story progress auto-advance
  useEffect(() => {
    if (activeStoryIndex === null) return;
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 1; // updates every 40ms, total 4 seconds
      });
    }, 40);

    return () => clearInterval(interval);
  }, [activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null); // End of stories
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      setActiveStoryIndex(null); // Close
    }
  };

  // Group stories by owner
  const uniqueStoryOwners = stories.reduce((acc: Story[], curr) => {
    if (!acc.some((item) => item.ownerId === curr.ownerId)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  const openStoryByOwner = (ownerId: string) => {
    const idx = stories.findIndex((s) => s.ownerId === ownerId);
    if (idx !== -1) {
      setActiveStoryIndex(idx);
    }
  };

  return (
    <div className="w-full py-4 border-b border-gray-900 bg-black overflow-x-auto scrollbar-none flex items-center gap-4 px-4 select-none">
      {/* Current User Add Story */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer" onClick={onAddStoryClick}>
        <div className="relative">
          <img
            src={profile?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=MohanDagar"}
            alt="My Profile"
            className="w-14 h-14 rounded-full border border-gray-800 object-cover p-0.5"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 border-2 border-black text-black">
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          </div>
        </div>
        <span className="text-xs text-gray-400 font-medium">Your Story</span>
      </div>

      {/* Stories Feed */}
      {uniqueStoryOwners.map((story) => (
        <div
          key={story.id}
          onClick={() => openStoryByOwner(story.ownerId)}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
            <img
              src={story.ownerPhotoURL}
              alt={story.ownerUsername}
              className="w-13 h-13 rounded-full border-2 border-black object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs text-gray-400 font-medium truncate max-w-[65px]">
            {story.ownerUsername}
          </span>
        </div>
      ))}

      {/* Story Lightbox Viewer */}
      <AnimatePresence>
        {activeStoryIndex !== null && stories[activeStoryIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
          >
            {/* Top Bar with Timers */}
            <div className="absolute top-4 inset-x-4 max-w-lg mx-auto z-10 flex flex-col gap-3">
              {/* Story segment timers */}
              <div className="flex gap-1.5 w-full">
                {stories.map((_, index) => (
                  <div key={index} className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-[40ms]"
                      style={{
                        width:
                          index < activeStoryIndex
                            ? "100%"
                            : index === activeStoryIndex
                            ? `${progress}%`
                            : "0%"
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header profile info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={stories[activeStoryIndex].ownerPhotoURL}
                    alt={stories[activeStoryIndex].ownerUsername}
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-white text-sm font-semibold">
                      <UsernameWithBadge
                        userId={stories[activeStoryIndex].ownerId}
                        username={stories[activeStoryIndex].ownerUsername}
                      />
                    </div>
                    <p className="text-white/40 text-xs">Active Story</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Left and Right navigation buttons on desktop */}
            <div className="hidden md:flex absolute inset-x-12 top-1/2 -translate-y-1/2 justify-between z-10">
              <button
                onClick={handlePrevStory}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-white hover:scale-105 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextStory}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-white hover:scale-105 transition-all cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Core Story Image Card */}
            <div className="relative w-full max-w-lg aspect-[9/16] bg-neutral-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
              {/* Click left/right zone to navigate easily on mobile */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrevStory} />
              <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNextStory} />

              <img
                src={stories[activeStoryIndex].imageURL}
                alt="Story Content"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Caption Overlay */}
              {stories[activeStoryIndex].caption && (
                <div className="absolute bottom-8 inset-x-6 z-20 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                  <p className="text-white font-medium text-sm">
                    {stories[activeStoryIndex].caption}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
