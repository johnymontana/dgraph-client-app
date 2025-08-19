'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
} from '@chakra-ui/react';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import ContentPanel from '@/components/ContentPanel';
import { DgraphProvider } from '@/context/DgraphContext';

function MainContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'connection' | 'schema' | 'guides' | 'query' | 'text-to-dql'>('connection');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client flag to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Responsive sidebar behavior - hydration-safe
  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (!isClient || typeof window === 'undefined') {
      return;
    }

    const checkBreakpoints = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, [isClient]);
  
  // Auto-close sidebar on mobile when section changes
  useEffect(() => {
    if (isClient && isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [activeSection, isMobile, isSidebarOpen, isClient]);

  // Auto-close sidebar on mobile by default
  useEffect(() => {
    if (isClient && isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, isClient]);

  const handleSectionChange = (section: 'connection' | 'schema' | 'guides' | 'query' | 'text-to-dql') => {
    console.log('Section changing from', activeSection, 'to', section);
    setActiveSection(section);
  };

  const handleToggleSidebar = () => {
    console.log('Sidebar toggle clicked. Current state:', isSidebarOpen, 'New state:', !isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Keyboard navigation support
  useEffect(() => {
    // Only add event listeners on the client side
    if (!isClient || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        handleToggleSidebar();
      }
      
      // Cmd/Ctrl + 1-5 for quick section navigation
      if ((event.metaKey || event.ctrlKey) && ['1', '2', '3', '4', '5'].includes(event.key)) {
        event.preventDefault();
        const sectionMap = {
          '1': 'connection' as const,
          '2': 'schema' as const,
          '3': 'guides' as const,
          '4': 'query' as const,
          '5': 'text-to-dql' as const,
        };
        handleSectionChange(sectionMap[event.key as keyof typeof sectionMap]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, isClient]);

  return (
    <>
      {/* Top Toolbar */}
      <Toolbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
      />

      {/* Mobile Overlay Backdrop */}
      {isMobile && isSidebarOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={35}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      {/* Main Content Area */}
      <Box
        pt="60px" // Fixed header height
        minH="100vh"
      >
        {/* Content Panel */}
        <ContentPanel
          activeSection={activeSection}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </Box>
    </>
  );
}

export default function Home() {
  return (
    <DgraphProvider>
      <Box minH="100vh" bg="bg.primary">
        <MainContent />
      </Box>
    </DgraphProvider>
  );
}
