'use client';

import React from 'react';
import { IconButton } from '@chakra-ui/react';
import { Icons } from '@/components/ui/icons';

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
    <IconButton
      onClick={onToggle}
      variant="ghost"
      size="sm"
      aria-label={title}
      title={title}
    >
      {isFullscreen ? (
        <Icons.collapse size={16} />
      ) : (
        <Icons.expand size={16} />
      )}
    </IconButton>
  );
}
