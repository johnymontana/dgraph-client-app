'use client';

import React from 'react';
import { IconButton, Icon } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

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
  const iconColor = useColorModeValue('gray.500', 'gray.400');
  const hoverColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <IconButton
      onClick={onToggle}
      variant="ghost"
      size="sm"
      aria-label={title}
      title={title}
      color={iconColor}
      _hover={{ color: hoverColor }}
    >
      {isFullscreen ? (
        <Icon viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M6 18L18 6M6 6l12 12"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      ) : (
        <Icon viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
            )}
    </IconButton>
  );
}
