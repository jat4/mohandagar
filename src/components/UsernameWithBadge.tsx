import React, { useEffect, useState } from "react";
import { getUserProfile } from "../services/dbService";
import VerifiedBadge from "./VerifiedBadge";

interface UsernameWithBadgeProps {
  userId: string;
  username: string;
  className?: string;
  badgeClassName?: string;
  showAtPrefix?: boolean; // Default true, displays @ before username
}

// Simple global cache to avoid duplicate Firestore lookups
const verifiedCache: Record<string, boolean> = {};
const pendingPromises: Record<string, Promise<any>> = {};

export default function UsernameWithBadge({
  userId,
  username,
  className = "font-bold text-white",
  badgeClassName = "w-3.5 h-3.5",
  showAtPrefix = true
}: UsernameWithBadgeProps) {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return !!verifiedCache[userId];
  });

  useEffect(() => {
    if (!userId) return;

    if (verifiedCache[userId] !== undefined) {
      setIsVerified(verifiedCache[userId]);
      return;
    }

    let isMounted = true;

    const fetchVerification = async () => {
      try {
        if (!pendingPromises[userId]) {
          pendingPromises[userId] = getUserProfile(userId);
        }
        const profile = await pendingPromises[userId];
        const verified = !!profile?.isVerified;
        verifiedCache[userId] = verified;
        if (isMounted) {
          setIsVerified(verified);
        }
      } catch (err) {
        console.error("Error fetching user verification status:", err);
      }
    };

    fetchVerification();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const isGold = username?.toLowerCase().replace(/^@/, "") === "admin";
  const displaysVerified = isVerified || isGold;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} id={`user-badge-${username}`}>
      <span>
        {showAtPrefix ? "@" : ""}
        {username}
      </span>
      {displaysVerified && <VerifiedBadge className={badgeClassName} isGold={isGold} />}
    </span>
  );
}
