'use client';

import React from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { Button, Box, HStack } from '@chakra-ui/react';

interface CodeBlockProps {
  children: string;
  className?: string;
}

interface MdxGuideRendererProps {
  content: MDXRemoteSerializeResult;
  onLoadQuery: (query: string) => void;
  onLoadMutation?: (mutation: string) => void;
  onViewSchema?: () => void;
}

export default function MdxGuideRenderer({ content, onLoadQuery, onLoadMutation, onViewSchema }: MdxGuideRendererProps) {
  // Custom components for MDX rendering
  const components = {
    // Override pre and code blocks to handle special dql-query language
    pre: (props: any) => <div {...props} className="relative my-4" />,
    code: (props: CodeBlockProps) => {
      const className = props.className || '';
      const language = className.replace('language-', '');
      
      // Special handling for interactive code blocks
      if (language === 'dql-query') {
        return (
          <Box 
            bg="blue.50" 
            border="1px solid" 
            borderColor="blue.200" 
            borderRadius="md" 
            p={4} 
            my={4}
            position="relative"
            _dark={{ bg: "blue.900", borderColor: "blue.700" }}
          >
            <Box 
              as="pre" 
              fontSize="sm" 
              fontFamily="mono" 
              color="gray.800"
              _dark={{ color: "gray.100" }}
              overflowX="auto"
              mb={2}
            >
              {props.children}
            </Box>
            <Button
              onClick={() => onLoadQuery(props.children)}
              size="xs"
              colorPalette="blue"
              position="absolute"
              top={2}
              right={2}
            >
              Run Query
            </Button>
          </Box>
        );
      }
      
      if (language === 'dql-mutation') {
        return (
          <Box 
            bg="orange.50" 
            border="1px solid" 
            borderColor="orange.200" 
            borderRadius="md" 
            p={4} 
            my={4}
            position="relative"
            _dark={{ bg: "orange.900", borderColor: "orange.700" }}
          >
            <Box 
              as="pre" 
              fontSize="sm" 
              fontFamily="mono" 
              color="gray.800"
              _dark={{ color: "gray.100" }}
              overflowX="auto"
              mb={2}
            >
              {props.children}
            </Box>
            <Button
              onClick={() => onLoadMutation?.(props.children)}
              size="xs"
              colorPalette="orange"
              position="absolute"
              top={2}
              right={2}
              disabled={!onLoadMutation}
            >
              Run Mutation
            </Button>
          </Box>
        );
      }
      
      if (language === 'dql-schema') {
        return (
          <Box 
            bg="purple.50" 
            border="1px solid" 
            borderColor="purple.200" 
            borderRadius="md" 
            p={4} 
            my={4}
            position="relative"
            _dark={{ bg: "purple.900", borderColor: "purple.700" }}
          >
            <Box 
              as="pre" 
              fontSize="sm" 
              fontFamily="mono" 
              color="gray.800"
              _dark={{ color: "gray.100" }}
              overflowX="auto"
              mb={2}
            >
              {props.children}
            </Box>
            <HStack position="absolute" top={2} right={2} gap={1}>
              <Button
                onClick={() => onViewSchema?.()}
                size="xs"
                colorPalette="purple"
                variant="outline"
                disabled={!onViewSchema}
              >
                View Schema
              </Button>
              <Button
                onClick={() => onLoadMutation?.(props.children)}
                size="xs"
                colorPalette="purple"
                disabled={!onLoadMutation}
              >
                Apply Schema
              </Button>
            </HStack>
          </Box>
        );
      }
      
      // Regular code blocks
      return (
        <Box 
          as="pre" 
          bg="bg.tertiary" 
          p={4} 
          borderRadius="md" 
          overflowX="auto" 
          my={4}
          border="1px solid"
          borderColor="border.primary"
        >
          <Box as="code" fontSize="sm" fontFamily="mono" className={className}>
            {props.children}
          </Box>
        </Box>
      );
    },
    h1: (props: any) => (
      <Box as="h1" fontSize="2xl" fontWeight="bold" mb={4} mt={6} color="fg.primary" {...props} />
    ),
    h2: (props: any) => (
      <Box as="h2" fontSize="xl" fontWeight="bold" mb={3} mt={5} color="fg.primary" {...props} />
    ),
    h3: (props: any) => (
      <Box as="h3" fontSize="lg" fontWeight="bold" mb={2} mt={4} color="fg.primary" {...props} />
    ),
    p: (props: any) => (
      <Box mb={4} color="fg.secondary" lineHeight="1.6" {...props} />
    ),
    ul: (props: any) => (
      <Box as="ul" listStyleType="disc" pl={6} mb={4} color="fg.secondary" {...props} />
    ),
    ol: (props: any) => (
      <Box as="ol" listStyleType="decimal" pl={6} mb={4} color="fg.secondary" {...props} />
    ),
    li: (props: any) => (
      <Box as="li" mb={1} {...props} />
    ),
    a: (props: any) => (
      <Box 
        as="a" 
        color="accent.primary" 
        textDecoration="underline"
        _hover={{ color: "accent.secondary" }}
        {...props} 
      />
    ),
    blockquote: (props: any) => (
      <Box
        borderLeft="4px solid"
        borderColor="border.secondary"
        pl={4}
        fontStyle="italic"
        color="fg.tertiary"
        my={4}
        {...props}
      />
    ),
  };

  return <MDXRemote {...content} components={components} />;
}
