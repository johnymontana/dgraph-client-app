'use client';

import React, { useState } from 'react';
import { useDgraph } from '@/context/DgraphContext';
import { buildVectorSearchQuery } from '@/utils/vectorSearchBuilder';
import {
  Box,
  Card,
  Heading,
  Field,
  Input,
  Button,
  Text,
  Alert,
  VStack,
  HStack,
  Badge,
  Textarea,
} from '@chakra-ui/react';
import { Icons } from '@/components/ui/icons';

interface VectorSearchPanelProps {
  onQueryGenerated: (query: string, variables: Record<string, any>) => void;
}

export default function VectorSearchPanel({ onQueryGenerated }: VectorSearchPanelProps) {
  const { embeddingService, embeddingProvider } = useDgraph();
  const [searchText, setSearchText] = useState('');
  const [vectorField, setVectorField] = useState('description_embedding');
  const [topK, setTopK] = useState(10);
  const [alpha] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerateEmbedding = embeddingService && embeddingProvider;

  const handleGenerateQuery = async () => {
    if (!embeddingService || !searchText.trim()) {
      setError('Please enter search text and configure embedding service');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await embeddingService.generateEmbedding(searchText.trim());
      
      const { query, variables } = buildVectorSearchQuery({
        queryText: searchText,
        embedding: result.embedding,
        field: vectorField,
        topK,
        alpha
      });

      onQueryGenerated(query, variables);
    } catch (err: any) {
      console.error('Error generating embedding:', err);
      setError(err.message || 'Failed to generate embedding');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickSearch = () => {
    const sampleQuery = `query vectorSearch($queryVector: [float], $topK: int, $alpha: float) {
  vectorSearch(by: ${vectorField}, vector: $queryVector, topk: $topK, alpha: $alpha) {
    uid
    dgraph.type
    ${vectorField}
    name
    description
  }
}`;
    onQueryGenerated(sampleQuery, {});
  };


  return (
    <Card.Root variant="elevated" h="full">
      <Box p={4} borderBottom="1px" borderColor="border.primary">
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1} flex={1}>
            <Heading textStyle="heading.card">
              Vector Search
            </Heading>
            <Text textStyle="body.small">
              Generate embeddings for semantic search
            </Text>
          </VStack>
          {canGenerateEmbedding && (
            <Badge
              variant="solid"
              colorPalette="blue"
              size="sm"
              borderRadius="full"
              px={3}
              py={1}
            >
              {embeddingProvider.toUpperCase()}
            </Badge>
          )}
        </HStack>
      </Box>

      <Box p={4} flex={1}>
        <VStack gap={4} align="stretch" h="full">
          {!canGenerateEmbedding && (
            <Alert.Root status="warning" variant="subtle" borderRadius="lg">
              <Alert.Indicator />
              <Alert.Content>
                <Text textStyle="body.medium">
                  Configure embedding provider in connection settings to enable vector search
                </Text>
              </Alert.Content>
            </Alert.Root>
          )}

          {error && (
            <Alert.Root status="error" variant="subtle" borderRadius="lg">
              <Alert.Indicator />
              <Alert.Content>
                <Text textStyle="body.medium">{error}</Text>
              </Alert.Content>
            </Alert.Root>
          )}


          <Field.Root>
            <Field.Label textStyle="label">
              Search Text
            </Field.Label>
            <Textarea
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter text to search for similar content..."
              disabled={!canGenerateEmbedding}
              size="lg"
              borderRadius="lg"
              resize="vertical"
              minH="80px"
              _focus={{ 
                borderColor: 'accent.primary',
                shadow: 'shadow.focus',
                ring: 'none'
              }}
              _disabled={{
                opacity: 0.6,
                cursor: 'not-allowed'
              }}
            />
            <Field.HelperText textStyle="helper">
              Text that will be converted to an embedding for semantic search
            </Field.HelperText>
          </Field.Root>

          <HStack gap={4}>
            <Field.Root flex={1}>
              <Field.Label textStyle="label">
                Vector Field
              </Field.Label>
              <Input
                type="text"
                value={vectorField}
                onChange={(e) => setVectorField(e.target.value)}
                placeholder="description_embedding"
                disabled={!canGenerateEmbedding}
                size="lg"
                borderRadius="lg"
                _focus={{ 
                  borderColor: 'accent.primary',
                  shadow: 'shadow.focus',
                  ring: 'none'
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
              />
              <Field.HelperText textStyle="helper">
                Dgraph predicate containing vector embeddings
              </Field.HelperText>
            </Field.Root>

            <Field.Root w="100px">
              <Field.Label textStyle="label">
                Top K
              </Field.Label>
              <Input
                type="number"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
                min={1}
                max={100}
                disabled={!canGenerateEmbedding}
                size="lg"
                borderRadius="lg"
                _focus={{ 
                  borderColor: 'accent.primary',
                  shadow: 'shadow.focus',
                  ring: 'none'
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
              />
              <Field.HelperText textStyle="helper">
                Results limit
              </Field.HelperText>
            </Field.Root>
          </HStack>

          <VStack gap={3} align="stretch">
            <Button
              onClick={handleGenerateQuery}
              loading={isGenerating}
              loadingText="Generating..."
              disabled={!canGenerateEmbedding || !searchText.trim()}
              colorPalette="blue"
              size="lg"
              w="full"
              gap={2}
              borderRadius="lg"
            >
              <Icons.search size={16} />
              <Text>Generate Vector Search Query</Text>
            </Button>

            <Button
              onClick={handleQuickSearch}
              variant="outline"
              size="md"
              w="full"
              gap={2}
              borderRadius="lg"
              _hover={{
                bg: 'bg.hover',
                borderColor: 'accent.primary'
              }}
            >
              <Icons.query size={16} />
              <Text>Insert Vector Search Template</Text>
            </Button>
          </VStack>

          <Box flex={1} />
          
          <Box p={3} bg="bg.muted" borderRadius="lg">
            <Text textStyle="body.small" mb={2} fontWeight="semibold">
              Vector Search Help
            </Text>
            <Text textStyle="helper">
              1. Configure embedding provider in connection settings
            </Text>
            <Text textStyle="helper">
              2. Enter text to search for similar content
            </Text>
            <Text textStyle="helper">
              3. Specify the field containing vector embeddings
            </Text>
            <Text textStyle="helper">
              4. Generate query with embeddings as variables
            </Text>
          </Box>
        </VStack>
      </Box>
    </Card.Root>
  );
}