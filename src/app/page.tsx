'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import ContentPanel from '@/components/ContentPanel';
import { DgraphProvider } from '@/context/DgraphContext';

function MainContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'connection' | 'schema' | 'guides' | 'query'>('connection');
  const { connected } = useDgraph();

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
        pt={{ base: "56px", md: "60px" }} // Responsive header height
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
