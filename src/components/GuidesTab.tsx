'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Grid,
  Badge,
  Spinner,
  Alert,
  Drawer,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';
import ResizableContainer from './ResizableContainer';
import QueryEditor from './QueryEditor';
import GraphVisualization from './GraphVisualization';
import GeoVisualization from './GeoVisualization';
import SchemaVisualization from './SchemaVisualization';
import { hasGeoData } from '@/utils/geoUtils';
import { GuideMetadata } from '@/utils/mdxLoader';
import MdxGuideRenderer from './mdx/MdxGuideRenderer';
import { serialize } from 'next-mdx-remote/serialize';

interface GuideItemProps {
  guide: GuideMetadata;
  isActive: boolean;
  onClick: () => void;
}

function GuideItem({ guide, isActive, onClick }: GuideItemProps) {
  return (
    <Card.Root
      variant={isActive ? "elevated" : "outline"}
      cursor="pointer"
      onClick={onClick}
      bg={isActive ? "accent.primary" : "bg.secondary"}
      color={isActive ? "white" : "fg.primary"}
      borderColor={isActive ? "accent.primary" : "border.primary"}
      _hover={{
        bg: isActive ? "accent.primary" : "bg.tertiary",
        borderColor: isActive ? "accent.primary" : "border.secondary"
      }}
      transition="all 0.2s"
    >
      <Card.Body p={4}>
        <VStack align="start" gap={2}>
          <HStack justify="space-between" w="full">
            <Heading size="sm" color={isActive ? "white" : "fg.primary"}>
              {guide.title}
            </Heading>
            <Badge
              variant="solid"
              colorPalette={isActive ? "gray" : "blue"}
              size="sm"
            >
              {guide.order}
            </Badge>
          </HStack>
          <Text 
            fontSize="sm" 
            color={isActive ? "whiteAlpha.900" : "fg.secondary"}
            lineClamp={2}
          >
            {guide.description}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

interface InteractiveGuideViewerProps {
  guide: { content: string; metadata: GuideMetadata };
  onRunQuery: (query: string) => void;
  onRunMutation: (mutation: string) => void;
  onViewSchema: () => void;
}

function InteractiveGuideViewer({ 
  guide, 
  onRunQuery, 
  onRunMutation,
  onViewSchema
}: InteractiveGuideViewerProps) {
  const [serializedContent, setSerializedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function serializeContent() {
      try {
        const serialized = await serialize(guide.content);
        setSerializedContent(serialized);
        setLoading(false);
      } catch (error) {
        console.error('Error serializing MDX content:', error);
        setLoading(false);
      }
    }

    serializeContent();
  }, [guide.content]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="accent.primary" />
      </Box>
    );
  }

  return (
    <Box h="full">
      <VStack align="start" gap={4} h="full">
        <Box>
          <Heading size="md" color="fg.primary" mb={2}>
            {guide.metadata.title}
          </Heading>
          <Text color="fg.secondary" fontSize="sm">
            {guide.metadata.description}
          </Text>
        </Box>
        
        <Box 
          flex={1} 
          w="full" 
          overflowY="auto" 
          className="prose prose-indigo max-w-none"
          css={{
            '& pre': {
              position: 'relative',
              borderRadius: 'var(--chakra-radii-md)',
              backgroundColor: 'var(--chakra-colors-bg-tertiary)',
              border: '1px solid var(--chakra-colors-border-primary)'
            },
            '& code': {
              backgroundColor: 'var(--chakra-colors-bg-tertiary)',
              color: 'var(--chakra-colors-fg-primary)',
              padding: '2px 4px',
              borderRadius: 'var(--chakra-radii-sm)',
              fontSize: 'var(--chakra-fontSizes-sm)'
            }
          }}
        >
          {serializedContent && (
            <MdxGuideRenderer 
              content={serializedContent} 
              onLoadQuery={onRunQuery}
              onLoadMutation={onRunMutation}
              onViewSchema={onViewSchema}
            />
          )}
        </Box>
      </VStack>
    </Box>
  );
}

export default function GuidesTab() {
  const { connected, dgraphService, schemaText } = useDgraph();
  const [availableGuides, setAvailableGuides] = useState<GuideMetadata[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<{ content: string; metadata: GuideMetadata } | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);

  // Load available guides
  useEffect(() => {
    async function loadGuides() {
      try {
        const response = await fetch('/api/guides');
        if (!response.ok) throw new Error('Failed to load guides');
        const guides = await response.json();
        setAvailableGuides(guides);
        setLoading(false);
      } catch (error) {
        console.error('Error loading guides:', error);
        setError('Failed to load guides');
        setLoading(false);
      }
    }

    loadGuides();
  }, []);

  // Load selected guide content
  const handleSelectGuide = async (guide: GuideMetadata) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/guides?slug=${guide.slug}`);
      if (!response.ok) throw new Error('Failed to load guide content');
      const guideData = await response.json();
      setSelectedGuide(guideData);
      setQueryResult(null);
      setActiveQuery('');
      setLoading(false);
    } catch (error) {
      console.error('Error loading guide content:', error);
      setError('Failed to load guide content');
      setLoading(false);
    }
  };

  // Execute query from guide
  const handleRunQuery = async (query: string) => {
    if (!connected || !dgraphService) {
      setError('Please connect to a database first');
      return;
    }

    try {
      setActiveQuery(query);
      setError(null);
      const result = await dgraphService.query(query);
      setQueryResult(result);
    } catch (error) {
      console.error('Query execution error:', error);
      setError(error instanceof Error ? error.message : 'Query execution failed');
    }
  };

  // Execute mutation from guide
  const handleRunMutation = async (mutation: string) => {
    if (!connected || !dgraphService) {
      setError('Please connect to a database first');
      return;
    }

    try {
      setError(null);
      await dgraphService.mutate(mutation);
      setQueryResult({ message: 'Mutation executed successfully' });
    } catch (error) {
      console.error('Mutation execution error:', error);
      setError(error instanceof Error ? error.message : 'Mutation execution failed');
    }
  };

  // View schema action
  const handleViewSchema = () => {
    setShowSchema(true);
  };

  if (loading && !selectedGuide) {
    return (
      <VStack gap={6} align="stretch" h="full">
        <Box>
          <Heading as="h2" size="xl" color="fg.primary" mb={2}>
            Interactive Learning Guides
          </Heading>
          <Text color="fg.secondary">
            Hands-on tutorials to master Dgraph and DQL
          </Text>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center" h="400px">
          <Spinner size="xl" color="accent.primary" />
        </Box>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack gap={6} align="stretch">
        <Box>
          <Heading as="h2" size="xl" color="fg.primary" mb={2}>
            Interactive Learning Guides
          </Heading>
          <Text color="fg.secondary">
            Hands-on tutorials to master Dgraph and DQL
          </Text>
        </Box>
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      </VStack>
    );
  }

  // Guide selection view
  if (!selectedGuide) {
    return (
      <VStack gap={6} align="stretch">
        <Box>
          <Heading as="h2" size="xl" color="fg.primary" mb={2}>
            Interactive Learning Guides
          </Heading>
          <Text color="fg.secondary">
            Choose a guide to start your interactive learning experience
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
          {availableGuides.map((guide) => (
            <GuideItem
              key={guide.slug}
              guide={guide}
              isActive={false}
              onClick={() => handleSelectGuide(guide)}
            />
          ))}
        </Grid>

        {!connected && (
          <Alert.Root status="info">
            <Alert.Indicator />
            <Alert.Title>Database Connection Required</Alert.Title>
            <Alert.Description>
              Connect to a Dgraph database to enable interactive features in the guides.
            </Alert.Description>
          </Alert.Root>
        )}
      </VStack>
    );
  }

  // Interactive guide view with query editor and visualization
  return (
    <VStack gap={4} align="stretch" h="calc(100vh - 200px)">
      <HStack justify="space-between" align="center">
        <Box>
          <Heading as="h2" size="xl" color="fg.primary">
            Interactive Learning Guides
          </Heading>
          <Text color="fg.secondary" fontSize="sm" mt={1}>
            {selectedGuide.metadata.title}
          </Text>
        </Box>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedGuide(null);
            setQueryResult(null);
            setActiveQuery('');
            setError(null);
          }}
        >
          ← Back to Guides
        </Button>
      </HStack>

      {error && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      <Box h="full">
        <ResizableContainer
          direction="horizontal"
          initialSplit={40}
          minFirstSize={30}
          minSecondSize={30}
          firstComponent={
            <InteractiveGuideViewer
              guide={selectedGuide}
              onRunQuery={handleRunQuery}
              onRunMutation={handleRunMutation}
              onViewSchema={handleViewSchema}
            />
          }
          secondComponent={
            <ResizableContainer
              direction="vertical"
              initialSplit={50}
              minFirstSize={20}
              minSecondSize={20}
              firstComponent={
                <Box h="full" p={2}>
                  <VStack align="start" gap={2} h="full">
                    <Text fontSize="sm" fontWeight="medium" color="fg.primary">
                      Interactive Query Editor
                    </Text>
                    <Box 
                      flex={1} 
                      w="full" 
                      border="1px solid" 
                      borderColor="border.primary" 
                      borderRadius="md"
                      overflow="hidden"
                    >
                      <QueryEditor 
                        onQueryResult={setQueryResult}
                        initialQuery={activeQuery}
                        compact={true}
                      />
                    </Box>
                  </VStack>
                </Box>
              }
              secondComponent={
                <Box h="full" p={2}>
                  <VStack align="start" gap={2} h="full">
                    <Text fontSize="sm" fontWeight="medium" color="fg.primary">
                      Results & Visualization
                    </Text>
                    <Box 
                      flex={1} 
                      w="full" 
                      border="1px solid" 
                      borderColor="border.primary" 
                      borderRadius="md"
                      overflow="hidden"
                      bg="bg.secondary"
                    >
                      {queryResult ? (
                        <VStack gap={0} h="full">
                          <GraphVisualization data={queryResult} />
                          {hasGeoData(queryResult) && <GeoVisualization data={queryResult} />}
                        </VStack>
                      ) : (
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center" 
                          h="full"
                          color="fg.tertiary"
                        >
                          <Text textAlign="center">
                            Click queries in the guide to run them interactively
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </VStack>
                </Box>
              }
            />
          }
        />
      </Box>
      
      {/* Schema Drawer */}
      <Drawer.Root open={showSchema} onOpenChange={(details) => setShowSchema(details.open)} size="lg">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Database Schema</Drawer.Title>
              <Drawer.Description>
                Current schema structure and type definitions
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <SchemaVisualization schemaText={schemaText || ''} />
            </Drawer.Body>
            <Drawer.Footer>
              <Button onClick={() => setShowSchema(false)}>
                Close
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </VStack>
  );
}