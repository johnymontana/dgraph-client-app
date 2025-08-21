'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  Heading,
  Button,
} from '@chakra-ui/react';
import ConnectionForm from './ConnectionForm';
import SchemaEditor from './SchemaEditor';
import GuidesTab from './GuidesTab';
import QueryEditor from './QueryEditor';
import TextToDqlTab from './TextToDqlTab';
import VectorSearchPanel from './VectorSearchPanel';
import ResizableContainer from './ResizableContainer';
import GraphVisualization from './GraphVisualization';
import GeoVisualization from './GeoVisualization';
import GeospatialTab from './GeospatialTab';
import { hasGeoData } from '@/utils/geoUtils';
import { useDgraph } from '@/context/DgraphContext';
import { Icons } from '@/components/ui/icons';

interface ContentPanelProps {
  activeSection: 'connection' | 'schema' | 'guides' | 'query' | 'text-to-dql' | 'geospatial';
  isSidebarOpen: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

export default function ContentPanel({ 
  activeSection, 
  isSidebarOpen, 
  isMobile, 
  isTablet 
}: ContentPanelProps) {
  const { connected } = useDgraph();
  const [queryResult, setQueryResult] = useState<any>(null);
  const [showVectorSearch, setShowVectorSearch] = useState(false);
  const queryEditorRef = React.useRef<any>(null);

  const renderConnectionSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading textStyle="heading.section" mb={3}>
          Database Connection
        </Heading>
        <Text textStyle="body.medium">
          Connect to your DGraph database to start exploring and querying data
        </Text>
      </Box>

      <ConnectionForm />

      {connected && (
        <Box
          bg="status.success"
          color="white"
          borderRadius="lg"
          p={4}
          shadow="shadow.sm"
        >
          <HStack gap={3}>
            <Icons.success size={20} />
            <VStack align="start" gap={0}>
              <Text fontWeight="semibold" fontSize="sm">
                Successfully Connected
              </Text>
              <Text fontSize="xs" opacity={0.9}>
                Ready to explore your DGraph database
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}
    </VStack>
  );

  const renderSchemaSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading textStyle="heading.section" mb={3}>
          Schema Management
        </Heading>
        <Text textStyle="body.medium">
          View and manage your database schema, types, and predicates
        </Text>
      </Box>

      {!connected ? (
        <Card.Root variant="elevated">
          <VStack gap={4} align="center" py={12}>
            <Box
              p={4}
              borderRadius="full"
              bg="bg.muted"
              color="fg.tertiary"
            >
              <Icons.database size={32} />
            </Box>
            <VStack gap={2} align="center">
              <Text textStyle="body.medium" textAlign="center">
                Database Connection Required
              </Text>
              <Text textStyle="body.small" textAlign="center" maxW="md">
                Connect to a database first to view and manage schema
              </Text>
            </VStack>
          </VStack>
        </Card.Root>
      ) : (
        <SchemaEditor />
      )}
    </VStack>
  );

  const renderGuidesSection = () => (
    <GuidesTab />
  );

  const renderTextToDqlSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading textStyle="heading.section" mb={3}>
          Text to DQL
        </Heading>
        <Text textStyle="body.medium">
          Convert natural language queries to DQL using AI assistance
        </Text>
      </Box>

      {!connected ? (
        <Card.Root variant="elevated">
          <VStack gap={4} align="center" py={12}>
            <Box
              p={4}
              borderRadius="full"
              bg="bg.muted"
              color="fg.tertiary"
            >
              <Icons.ai size={32} />
            </Box>
            <VStack gap={2} align="center">
              <Text textStyle="body.medium">
                Database Connection Required
              </Text>
              <Text textStyle="body.small" textAlign="center">
                Connect to a Dgraph database to use AI-powered query generation
              </Text>
            </VStack>
          </VStack>
        </Card.Root>
      ) : (
        <TextToDqlTab />
      )}
    </VStack>
  );

  const renderGeospatialSection = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading textStyle="heading.section" mb={3}>
          Geospatial Analysis
        </Heading>
        <Text textStyle="body.medium">
          Interactive map-based exploration of geospatial data in your Dgraph database
        </Text>
      </Box>

      {!connected ? (
        <Card.Root variant="elevated">
          <VStack gap={4} align="center" py={12}>
            <Box
              p={4}
              borderRadius="full"
              bg="bg.muted"
              color="fg.tertiary"
            >
              <Icons.map size={32} />
            </Box>
            <VStack gap={2} align="center">
              <Text textStyle="body.medium">
                Database Connection Required
              </Text>
              <Text textStyle="body.small" textAlign="center">
                Connect to a Dgraph database to use geospatial features
              </Text>
            </VStack>
          </VStack>
        </Card.Root>
      ) : (
        <GeospatialTab />
      )}
    </VStack>
  );

  const renderQuerySection = () => {

    const handleVectorQueryGenerated = (generatedQuery: string, variables: Record<string, any>) => {
      if (queryEditorRef.current?.handleVectorQueryGenerated) {
        queryEditorRef.current.handleVectorQueryGenerated(generatedQuery, variables);
      }
    };

    return (
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Box>
            <Heading textStyle="heading.section" mb={3}>
              Query Editor
            </Heading>
            <Text textStyle="body.medium">
              Write and execute DQL queries against your connected database
            </Text>
          </Box>
          <Button
            onClick={() => setShowVectorSearch(!showVectorSearch)}
            variant="outline"
            size="sm"
            gap={2}
            borderRadius="lg"
            _hover={{
              bg: 'bg.hover',
              borderColor: 'accent.primary'
            }}
          >
            <Icons.search size={16} />
            <Text>Vector Search</Text>
          </Button>
        </HStack>

        {/* Query interface with optional vector search panel */}
        <Box h="calc(100vh - 280px)" borderRadius="lg" overflow="hidden">
          {showVectorSearch ? (
            <ResizableContainer
              direction="horizontal"
              initialSplit={70}
              minFirstSize={50}
              minSecondSize={25}
              firstComponent={
                <ResizableContainer
                  direction="vertical"
                  initialSplit={40}
                  minFirstSize={20}
                  minSecondSize={20}
                  firstComponent={
                    <QueryEditor 
                      ref={queryEditorRef}
                      onQueryResult={setQueryResult}
                    />
                  }
                  secondComponent={
                    <>
                      {queryResult && <GraphVisualization data={queryResult} />}
                      {queryResult && hasGeoData(queryResult) && <GeoVisualization data={queryResult} />}
                      {!queryResult && (
                        <Card.Root variant="subtle" h="full" bg="bg.muted">
                          <VStack gap={4} align="center" justify="center" h="full">
                            <Box
                              p={4}
                              borderRadius="full"
                              bg="bg.muted"
                              color="fg.tertiary"
                            >
                              <Icons.play size={24} />
                            </Box>
                            <VStack gap={1} align="center">
                              <Text textStyle="body.medium">
                                No Results Yet
                              </Text>
                              <Text textStyle="body.small" textAlign="center">
                                Run a query to see visualization results here
                              </Text>
                            </VStack>
                          </VStack>
                        </Card.Root>
                      )}
                    </>
                  }
                />
              }
              secondComponent={
                <VectorSearchPanel 
                  onQueryGenerated={handleVectorQueryGenerated}
                />
              }
            />
          ) : (
            <ResizableContainer
              direction="vertical"
              initialSplit={40}
              minFirstSize={20}
              minSecondSize={20}
              firstComponent={
                <QueryEditor 
                  ref={queryEditorRef}
                  onQueryResult={setQueryResult}
                />
              }
              secondComponent={
                <>
                  {queryResult && <GraphVisualization data={queryResult} />}
                  {queryResult && hasGeoData(queryResult) && <GeoVisualization data={queryResult} />}
                  {!queryResult && (
                    <Card.Root variant="subtle" h="full" bg="bg.muted">
                      <VStack gap={4} align="center" justify="center" h="full">
                        <Box
                          p={4}
                          borderRadius="full"
                          bg="bg.muted"
                          color="fg.tertiary"
                        >
                          <Icons.play size={24} />
                        </Box>
                        <VStack gap={1} align="center">
                          <Text textStyle="body.medium">
                            No Results Yet
                          </Text>
                          <Text textStyle="body.small" textAlign="center">
                            Run a query to see visualization results here
                          </Text>
                        </VStack>
                      </VStack>
                    </Card.Root>
                  )}
                </>
              }
            />
          )}
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
      case 'text-to-dql':
        return renderTextToDqlSection();
      case 'geospatial':
        return renderGeospatialSection();
      default:
        return renderConnectionSection();
    }
  };

  // Responsive margin logic
  const getMarginLeft = () => {
    if (isMobile) return "0px";
    if (isTablet) return isSidebarOpen ? "280px" : "72px";
    return isSidebarOpen ? "280px" : "72px";
  };

  return (
    <Box
      ml={getMarginLeft()}
      transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      minH="calc(100vh - 60px)"
      bg="bg.primary"
    >
      <Box
        maxW="full"
        h="full"
        py={6}
        px={{ base: 4, md: 6, lg: 8 }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
}
