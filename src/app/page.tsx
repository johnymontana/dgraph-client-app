'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  useBreakpointValue,
} from '@chakra-ui/react';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import ContentPanel from '@/components/ContentPanel';
import { DgraphProvider } from '@/context/DgraphContext';

function MainContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'connection' | 'schema' | 'guides' | 'query'>('connection');

  // Responsive sidebar behavior
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  
  // Auto-close sidebar on mobile when section changes
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [activeSection, isMobile, isSidebarOpen]);

  // Auto-close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSectionChange = (section: 'connection' | 'schema' | 'guides' | 'query') => {
    console.log('Section changing from', activeSection, 'to', section);
    setActiveSection(section);
  };

  const handleToggleSidebar = () => {
    console.log('Sidebar toggle clicked. Current state:', isSidebarOpen, 'New state:', !isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        handleToggleSidebar();
      }
      
      // Cmd/Ctrl + 1-4 for quick section navigation
      if ((event.metaKey || event.ctrlKey) && ['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        const sectionMap = {
          '1': 'connection' as const,
          '2': 'schema' as const,
          '3': 'guides' as const,
          '4': 'query' as const,
        };
        handleSectionChange(sectionMap[event.key as keyof typeof sectionMap]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

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
