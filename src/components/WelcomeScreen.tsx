'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';

interface WelcomeScreenProps {
  onQuickConnect: () => void;
}

export default function WelcomeScreen({ onQuickConnect }: WelcomeScreenProps) {
  const { connected } = useDgraph();

  if (connected) {
    return null;
  }

  return (
    <Box
      ml="280px"
      transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      minH="100vh"
      bg="bg.primary"
      pt="80px"
    >
      <Box
        maxW="4xl"
        mx="auto"
        py={12}
        px={{ base: 4, sm: 6, lg: 8 }}
      >
        <VStack gap={8} align="center" textAlign="center">
          {/* Hero Section */}
          <VStack gap={6} maxW="2xl">
            <Box>
              <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor" style={{ color: 'var(--chakra-colors-accent-primary)', marginBottom: '16px' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <Heading as="h1" size="2xl" color="fg.primary" mb={4}>
                Welcome to DGraph Client
              </Heading>
              <Text fontSize="lg" color="fg.secondary" lineHeight="tall">
                A modern, powerful tool for exploring and querying DGraph databases with an intuitive interface and advanced features.
              </Text>
            </Box>

            <VStack gap={4}>
              <Button
                onClick={onQuickConnect}
                colorPalette="blue"
                size="lg"
                h="48px"
                px={8}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Quick Start
              </Button>
              <Button
                variant="outline"
                colorPalette="gray"
                size="lg"
                h="48px"
                px={8}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View Documentation
              </Button>
            </VStack>
          </VStack>

          {/* Features Grid */}
          <Box w="full">
            <Heading as="h2" size="lg" color="fg.primary" mb={6} textAlign="center">
              Key Features
            </Heading>
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
              gap={6}
            >
              {[
                {
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                  title: "DQL Query Editor",
                  description: "Write and execute DQL queries with syntax highlighting and autocomplete"
                },
                {
                  icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7c0-2.21-3.582-4-8-4s-8 1.79-8 4z",
                  title: "Schema Management",
                  description: "Visualize and manage your database schema, types, and predicates"
                },
                {
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                  title: "Graph Visualization",
                  description: "Interactive graph visualization for query results and schema exploration"
                },
                {
                  icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
                  title: "Learning Guides",
                  description: "Interactive tutorials and examples to master DGraph DQL"
                },
                {
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                  title: "High Performance",
                  description: "Optimized for large datasets with efficient query execution"
                },
                {
                  icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
                  title: "Dark Mode",
                  description: "Beautiful dark and light themes for comfortable development"
                }
              ].map((feature, index) => (
                <Card.Root key={index} variant="elevated" p={6} h="full">
                  <VStack gap={4} align="center" textAlign="center">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" style={{ color: 'var(--chakra-colors-accent-primary)' }}>
                      <path d={feature.icon} />
                    </svg>
                    <Heading as="h3" size="sm" color="fg.primary">
                      {feature.title}
                    </Heading>
                    <Text fontSize="sm" color="fg.secondary" lineHeight="tall">
                      {feature.description}
                    </Text>
                  </VStack>
                </Card.Root>
              ))}
            </Box>
          </Box>

          {/* Quick Connect Info */}
          <Card.Root variant="elevated" p={6} maxW="md">
            <VStack gap={4} align="center" textAlign="center">
              <Badge
                variant="solid"
                colorPalette="blue"
                size="sm"
                borderRadius="full"
                px={3}
                py={1}
              >
                Quick Start
              </Badge>
              <Text fontSize="sm" color="fg.secondary">
                Use the provided connection string to quickly test the application with a sample database.
              </Text>
              <Button
                onClick={onQuickConnect}
                variant="outline"
                colorPalette="blue"
                size="sm"
                w="full"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Connect to Patient Graph
              </Button>
            </VStack>
          </Card.Root>
        </VStack>
      </Box>
    </Box>
  );
}
