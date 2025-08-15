'use client';

import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { serialize } from 'next-mdx-remote/serialize';
import MdxGuideRenderer from './mdx/MdxGuideRenderer';
import { GuideMetadata } from '@/utils/mdxLoader';
import {
  Box,
  Card,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  IconButton,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

// Import Slick carousel styles
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface GuidedExperienceProps {
  guides: { content: string; metadata: GuideMetadata }[];
  onLoadQuery: (query: string) => void;
  onClose: () => void;
}

export default function GuidedExperience({ guides, onLoadQuery, onClose }: GuidedExperienceProps) {
  const [serializedContent, setSerializedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const titleColor = useColorModeValue('blue.600', 'blue.400');

  // Serialize MDX content
  useEffect(() => {
    async function serializeContent() {
      try {
        const serialized = await Promise.all(
          guides.map(async (guide) => {
            return {
              content: await serialize(guide.content),
              metadata: guide.metadata
            };
          })
        );
        setSerializedContent(serialized);
        setLoading(false);
      } catch (error) {
        console.error('Error serializing MDX content:', error);
        setLoading(false);
      }
    }

    serializeContent();
  }, [guides]);

  // Slider settings
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    beforeChange: (_: number, next: number) => setActiveSlide(next),
    afterChange: (current: number) => setActiveSlide(current)
  };

  if (loading) {
    return (
      <Card.Root bg={bgColor} shadow="lg" p={6} mb={6}>
        <HStack justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="lg" color={textColor}>
            Guided DQL Experience
          </Heading>
          <IconButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close guided experience"
          >
            <Icon viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Icon>
          </IconButton>
        </HStack>
        <Box display="flex" justifyContent="center" alignItems="center" h="64">
          <Spinner size="xl" color="blue.500" />
        </Box>
      </Card.Root>
    );
  }

  return (
    <Card.Root bg={bgColor} shadow="lg" p={6} mb={6}>
      <VStack gap={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading as="h2" size="lg" color={textColor}>
            Guided DQL Experience
          </Heading>
          <HStack gap={4} align="center">
            <Text fontSize="sm" color={mutedTextColor}>
              Guide {activeSlide + 1} of {serializedContent.length}
            </Text>
            <IconButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              aria-label="Close guided experience"
            >
              <Icon viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Icon>
            </IconButton>
          </HStack>
        </HStack>

        {serializedContent.length > 0 ? (
          <Box className="guide-slider">
            <Slider {...settings}>
              {serializedContent.map((guide, index) => (
                <Box key={guide.metadata.slug} p={2}>
                  <VStack gap={4} align="start">
                    <Box>
                      <Heading as="h3" size="md" color={titleColor} mb={2}>
                        {guide.metadata.title}
                      </Heading>
                      <Text color={mutedTextColor}>
                        {guide.metadata.description}
                      </Text>
                    </Box>
                    <Box h="400px" overflowY="auto" pr={2} className="custom-scrollbar">
                      <Box className="prose prose-indigo max-w-none">
                        <MdxGuideRenderer content={guide.content} onLoadQuery={onLoadQuery} />
                      </Box>
                    </Box>
                  </VStack>
                </Box>
              ))}
            </Slider>
          </Box>
        ) : (
          <Box textAlign="center" p={8} border="1px" borderColor={borderColor} borderRadius="md">
            <Text color={mutedTextColor}>No guides available</Text>
          </Box>
                 )}

         <HStack justify="space-between" align="center">
          <Button
            onClick={() => (Slider as any).slickPrev()}
            disabled={activeSlide === 0}
            variant="outline"
            colorPalette="gray"
            size="md"
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            Previous
          </Button>
          <Button
            onClick={() => (Slider as any).slickNext()}
            disabled={activeSlide === serializedContent.length - 1}
            colorPalette="blue"
            size="md"
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            Next
          </Button>
        </HStack>
      </VStack>
    </Card.Root>
  );
}
