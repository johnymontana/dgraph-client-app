'use client';

import React from 'react';
import {
  Box,
  Card,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  IconButton,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  description?: string;
  type?: 'query' | 'mutation';
}

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (item: QueryHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteQuery: (id: string) => void;
}

export default function QueryHistory({
  history,
  onSelectQuery,
  onClearHistory,
  onDeleteQuery
}: QueryHistoryProps) {
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const deleteButtonColor = useColorModeValue('gray.400', 'gray.500');
  const deleteButtonHoverColor = useColorModeValue('red.600', 'red.400');
  const itemBorderColor = useColorModeValue('gray.200', 'gray.600');

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Truncate query for display
  const truncateQuery = (query: string, maxLength = 50) => {
    return query.length > maxLength
      ? query.substring(0, maxLength).replace(/\n/g, ' ') + '...'
      : query.replace(/\n/g, ' ');
  };

  return (
    <Card.Root bg={bgColor} border="1px" borderColor={borderColor} p={4} mb={4}>
      <VStack gap={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading as="h3" size="md" color={textColor}>
            Operation History
          </Heading>
          <Button
            onClick={onClearHistory}
            variant="ghost"
            size="sm"
            color="red.600"
            _hover={{ color: 'red.800' }}
          >
            Clear History
          </Button>
        </HStack>

        {history.length === 0 ? (
          <Text color={mutedTextColor}>
            No operation history yet. Run queries or mutations to see them here.
          </Text>
        ) : (
          <VStack gap={2} maxH="60" overflowY="auto">
            {history.map((item) => (
              <Box
                key={item.id}
                border="1px"
                borderColor={itemBorderColor}
                borderRadius="md"
                p={2}
                bg={cardBgColor}
                _hover={{ bg: hoverBgColor }}
                w="full"
              >
                <HStack justify="space-between" align="start">
                  <Box flex={1} mr={2}>
                    <HStack align="center" mb={1}>
                      {item.type === 'mutation' ? (
                        <Box
                          as="span"
                          px={2}
                          py={1}
                          fontSize="xs"
                          borderRadius="md"
                          bg="purple.100"
                          color="purple.800"
                        >
                          Mutation
                        </Box>
                      ) : (
                        <Box
                          as="span"
                          px={2}
                          py={1}
                          fontSize="xs"
                          borderRadius="md"
                          bg="blue.100"
                          color="blue.800"
                        >
                          Query
                        </Box>
                      )}
                      <Text
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ color: 'blue.600' }}
                        onClick={() => onSelectQuery(item)}
                        title="Click to use this operation"
                      >
                        {truncateQuery(item.query)}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color={mutedTextColor}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </Box>
                  <IconButton
                    onClick={() => onDeleteQuery(item.id)}
                    variant="ghost"
                    size="sm"
                    color={deleteButtonColor}
                    _hover={{ color: deleteButtonHoverColor }}
                    title="Delete this operation"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </IconButton>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Card.Root>
  );
}
