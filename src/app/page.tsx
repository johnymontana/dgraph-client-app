'use client';

import { useState } from 'react';
import { DgraphProvider } from '@/context/DgraphContext';
import ConnectionForm from '@/components/ConnectionForm';
import QueryEditor from '@/components/QueryEditor';
import SchemaEditor from '@/components/SchemaEditor';
import GraphVisualization from '@/components/GraphVisualization';
import GeoVisualization from '@/components/GeoVisualization';
import Drawer from '@/components/Drawer';
import ResizableContainer from '@/components/ResizableContainer';
import { hasGeoData } from '@/utils/geoUtils';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

export default function Home() {
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <DgraphProvider>
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box as="header" bg={headerBg} shadow="sm" borderBottom="1px" borderColor={borderColor}>
          <Container maxW="7xl" py={4} px={{ base: 4, sm: 6, lg: 8 }}>
            <Flex justify="space-between" align="center">
              <Flex align="center">
                {/* Drawer toggle button */}
                <IconButton
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  mr={4}
                  aria-label={isDrawerOpen ? "Close settings" : "Open settings"}
                  variant={isDrawerOpen ? "solid" : "ghost"}
                  colorPalette={isDrawerOpen ? "blue" : "gray"}
                  size="sm"
                  _hover={{ bg: hoverBgColor }}
                  _focus={{ ring: 2, ringColor: 'blue.500' }}
                  _active={{ bg: useColorModeValue('gray.200', 'gray.600') }}
                >
                  <Icon viewBox="0 0 24 24" color={textColor}>
                    <path
                      fill="currentColor"
                      d="M4 6h16M4 12h16M4 18h16"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Icon>
                </IconButton>
                <Heading as="h1" size="lg" color={textColor}>
                  Dgraph Client
                </Heading>
              </Flex>
              <Text fontSize="sm" color={mutedTextColor}>
                DQL Explorer
              </Text>
            </Flex>
          </Container>
        </Box>

        {/* Drawer for Connection and Schema */}
        <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <Box>
            <Heading as="h2" size="lg" color={textColor} mb={6}>
              Dgraph Settings
            </Heading>
            <ConnectionForm />
            <SchemaEditor />
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          as="main"
          maxW="7xl"
          mx="auto"
          py={6}
          px={{ base: 4, sm: 6, lg: 8 }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isDrawerOpen ? "translateX(0)" : "translateX(0)"}
          opacity={isDrawerOpen ? 0.8 : 1}
          filter={isDrawerOpen ? "blur(1px)" : "none"}
        >
          <Box px={{ base: 4, sm: 0 }}>
            {/* Query and Visualization with resizable container */}
            <Box h="calc(100vh - 200px)">
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
          </Box>
        </Box>

        {/* Footer */}
        <Box as="footer" bg={headerBg} borderTop="1px" borderColor={borderColor} mt={12}>
          <Container maxW="7xl" py={4} px={{ base: 4, sm: 6, lg: 8 }}>
            <Text textAlign="center" fontSize="sm" color={mutedTextColor}>
              Dgraph Client - DQL Explorer
            </Text>
          </Container>
        </Box>
      </Box>
    </DgraphProvider>
  );
}
