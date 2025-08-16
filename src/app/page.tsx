'use client';

import React, { useState } from 'react';
import {
  Box,
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

  const handleSectionChange = (section: 'connection' | 'schema' | 'guides' | 'query') => {
    console.log('Section changing from', activeSection, 'to', section);
    setActiveSection(section);
  };

  return (
    <>
      {/* Top Toolbar */}
      <Toolbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main Content Area */}
      <Box
        pt="60px" // Account for fixed header
        minH="100vh"
      >
        {/* Welcome Screen or Settings Panel */}
        {!connected ? (
          <>
            {/* Settings Panel */}
            <ContentPanel
              activeSection={activeSection}
              isSidebarOpen={isSidebarOpen}
            />
          </>
        ) : (
          <>
            {/* Settings Panel */}
            <ContentPanel
              activeSection={activeSection}
              isSidebarOpen={isSidebarOpen}
            />
          </>
        )}
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
