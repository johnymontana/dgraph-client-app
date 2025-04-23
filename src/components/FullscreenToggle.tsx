'use client';

import React from 'react';

interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
  title?: string;
}

export default function FullscreenToggle({
  isFullscreen,
  onToggle,
  title = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
}: FullscreenToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
      title={title}
      aria-label={title}
    >
      {isFullscreen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      )}
    </button>
  );
}
