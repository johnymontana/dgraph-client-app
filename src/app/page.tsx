'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import ContentPanel from '@/components/ContentPanel';
import QueryEditor from '@/components/QueryEditor';
import GraphVisualization from '@/components/GraphVisualization';
import GeoVisualization from '@/components/GeoVisualization';
import ResizableContainer from '@/components/ResizableContainer';
import { hasGeoData } from '@/utils/geoUtils';
import { DgraphProvider } from '@/context/DgraphContext';

function MainContent() {
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'connection' | 'schema' | 'guides'>('connection');
  const { connected } = useDgraph();

  const handleSectionChange = (section: 'connection' | 'schema' | 'guides') => {
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

            {/* Query Editor and Results */}
            <Box
              ml={isSidebarOpen ? "280px" : "60px"}
              transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              p={6}
            >
              <Container maxW="7xl" px={0}>
                <VStack gap={6} align="stretch">
                  <Box>
                    <Heading as="h2" size="lg" color="fg.primary" mb={2}>
                      Query Editor
                    </Heading>
                    <Text color="fg.secondary" fontSize="sm">
                      Write and execute DQL queries against your connected database
                    </Text>
                  </Box>

                  {/* Query and Visualization with resizable container */}
                  <Box h="calc(100vh - 300px)">
                    <ResizableContainer
                      direction="vertical"
                      initialSplit={40}
                      minFirstSize={20}
                      minSecondSize={20}
                      firstComponent={
                        <QueryEditor onQueryResult={setQueryResult} />
                      }
                      secondComponent={
                        <>
                          {queryResult && <GraphVisualization data={queryResult} />}
                          {queryResult && hasGeoData(queryResult) && <GeoVisualization data={queryResult} />}
                        </>
                      }
                    />
                  </Box>
                </VStack>
              </Container>
            </Box>
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
