'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Card,
  Heading,
} from '@chakra-ui/react';
import ConnectionForm from './ConnectionForm';
import SchemaEditor from './SchemaEditor';
import GuidedExperience from './GuidedExperience';
import QueryEditor from './QueryEditor';
import ResizableContainer from './ResizableContainer';
import GraphVisualization from './GraphVisualization';
import GeoVisualization from './GeoVisualization';
import { hasGeoData } from '@/utils/geoUtils';
import { useDgraph } from '@/context/DgraphContext';

interface ContentPanelProps {
  activeSection: 'connection' | 'schema' | 'guides' | 'query';
  isSidebarOpen: boolean;
}

export default function ContentPanel({ activeSection, isSidebarOpen }: ContentPanelProps) {
  const { connected } = useDgraph();
  const [queryResult, setQueryResult] = useState<any>(null);

  const renderConnectionSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading as="h2" size="lg" color="fg.primary" mb={2}>
          Database Connection
        </Heading>
        <Text color="fg.secondary" fontSize="sm">
          Connect to your DGraph database to start exploring and querying data
        </Text>
      </Box>

      <ConnectionForm />

      {connected && (
        <Box
          bg="green.50"
          border="1px solid"
          borderColor="green.200"
          borderRadius="md"
          p={4}
          color="green.800"
        >
          <Text fontWeight="medium">Successfully connected to DGraph</Text>
        </Box>
      )}
    </VStack>
  );

  const renderSchemaSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading as="h2" size="lg" color="fg.primary" mb={2}>
          Schema Management
        </Heading>
        <Text color="fg.secondary" fontSize="sm">
          View and manage your database schema, types, and predicates
        </Text>
      </Box>

      {!connected ? (
        <Card.Root variant="elevated" p={6}>
          <VStack gap={4} align="center" py={8}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ color: 'var(--chakra-colors-fg-tertiary)' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <Text color="fg.secondary" textAlign="center">
              Connect to a database first to view and manage schema
            </Text>
          </VStack>
        </Card.Root>
      ) : (
        <SchemaEditor />
      )}
    </VStack>
  );

  const renderGuidesSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading as="h2" size="lg" color="fg.primary" mb={2}>
          Learning Guides
        </Heading>
        <Text color="fg.secondary" fontSize="sm">
          Interactive tutorials and examples to help you master DGraph DQL
        </Text>
      </Box>

      <GuidedExperience
        guides={[]}
        onLoadQuery={() => {}}
        onClose={() => {}}
      />
    </VStack>
  );

  const renderQuerySection = () => {
    return (
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
                {!queryResult && (
                  <Box>
                    <Text color="fg.secondary" textAlign="center" py={8}>
                      Run a query to see results here
                    </Text>
                  </Box>
                )}
              </>
            }
          />
        </Box>
      </VStack>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'connection':
        return renderConnectionSection();
      case 'schema':
        return renderSchemaSection();
      case 'guides':
        return renderGuidesSection();
      case 'query':
        return renderQuerySection();
      default:
        return renderConnectionSection();
    }
  };

  return (
    <Box
      ml={isSidebarOpen ? "280px" : "0px"}
      transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      minH="100vh"
      bg="bg.primary"
    >
      <Box
        maxW="4xl"
        mx="auto"
        py={8}
        px={{ base: 4, sm: 6, lg: 8 }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
}
