import React from "react";

interface VerifiedBadgeProps {
  className?: string;
  isGold?: boolean;
}

export default function VerifiedBadge({ className = "w-4 h-4", isGold = false }: VerifiedBadgeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} inline-block ml-1 align-middle shrink-0`}
      aria-label="Verified Profile"
    >
      <path
        fill={isGold ? "#FFD700" : "#0095f6"}
        d="M12.003 2.001a1.2 1.2 0 0 1 .945.459l1.196 1.492a1.2 1.2 0 0 0 .935.432l1.905.022a1.2 1.2 0 0 1 1.189 1.189l.022 1.905a1.2 1.2 0 0 0 .432.935l1.492 1.196a1.2 1.2 0 0 1 .459.945a1.2 1.2 0 0 1-.459.945l-1.492 1.196a1.2 1.2 0 0 0-.432.935l-.022 1.905a1.2 1.2 0 0 1-1.189 1.189l-1.905.022a1.2 1.2 0 0 0-.935.432l-1.196 1.492a1.2 1.2 0 0 1-.945.459a1.2 1.2 0 0 1-.945-.459l-1.196-1.492a1.2 1.2 0 0 0-.935-.432l-1.905-.022a1.2 1.2 0 0 1-1.189-1.189l-.022-1.905a1.2 1.2 0 0 0-.432-.935l-1.492-1.196a1.2 1.2 0 0 1-.459-.945a1.2 1.2 0 0 1 .459-.945l1.492-1.196a1.2 1.2 0 0 0 .432-.935l.022-1.905a1.2 1.2 0 0 1 1.189-1.189l1.905-.022a1.2 1.2 0 0 0 .935-.432l1.196-1.492a1.2 1.2 0 0 1 .945-.459z"
      />
      <path
        fill={isGold ? "#000000" : "#ffffff"}
        d="M10.75 15.3l5.5-5.5a.8.8 0 0 0-1.13-1.13l-4.37 4.37l-1.87-1.87a.8.8 0 1 0-1.13 1.13l2.5 2.5a.8.8 0 0 0 1.13 0z"
      />
    </svg>
  );
}
