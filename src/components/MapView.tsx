'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box, Text, Spinner, VStack } from '@chakra-ui/react';

// Define type for node data
interface GeoNode {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  raw: any;
  type?: string;
}

interface MapViewProps {
  nodes: GeoNode[];
  edges: Array<{
    source: string;
    target: string;
    label: string;
  }>;
  onNodeClick?: (node: GeoNode) => void;
  height?: string;
}

export default function MapView({ nodes, edges, onNodeClick, height = '100%' }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('MapView render:', { nodes: nodes?.length, edges: edges?.length, height });

  // Cleanup function to properly dispose of the map
  const cleanupMap = useCallback(() => {
    if (map.current) {
      console.log('Cleaning up map');
      map.current.remove();
      map.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('MapView useEffect triggered:', {
      hasContainer: !!mapContainer.current,
      nodesCount: nodes?.length,
      containerDimensions: mapContainer.current ? {
        width: mapContainer.current.offsetWidth,
        height: mapContainer.current.offsetHeight
      } : 'no container'
    });

    if (!mapContainer.current) {
      console.log('No map container, returning early');
      return;
    }

    // Clean up any existing map
    cleanupMap();

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating new map instance');

      // Create a new map instance
      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [-74.006, 40.7128], // Default to NYC
        zoom: 10,
        attributionControl: {}
      });

      map.current = newMap;
      console.log('Map instance created, waiting for load event');

      // Wait for the map to load before adding data
      newMap.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoading(false);

        // Add nodes as markers
        if (nodes && nodes.length > 0) {
          console.log('Adding', nodes.length, 'markers to map');
          nodes.forEach((node) => {
            // Create a marker element
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = node.color || '#3B82F6';
            el.style.border = '2px solid white';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            // Add click handler
            el.addEventListener('click', () => {
              if (onNodeClick) {
                onNodeClick(node);
              }
            });

            // Create and add the marker
            new maplibregl.Marker(el)
              .setLngLat([node.lng, node.lat])
              .addTo(newMap);
          });

          // Fit bounds to show all nodes if there are any
          const bounds = new maplibregl.LngLatBounds();
          nodes.forEach(node => {
            bounds.extend([node.lng, node.lat]);
          });
          newMap.fitBounds(bounds, { padding: 50 });
          console.log('Map bounds fitted to markers');
        } else {
          console.log('No nodes to display, showing default view');
        }
      });

      // Handle map errors
      newMap.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

      // Force a resize after a short delay to ensure proper dimensions
      setTimeout(() => {
        if (newMap && mapContainer.current) {
          console.log('Forcing map resize');
          newMap.resize();
        }
      }, 100);

    } catch (err) {
      console.error('Error creating map:', err);
      setError(err instanceof Error ? err.message : 'Failed to create map');
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      cleanupMap();
    };
  }, [nodes, edges, onNodeClick, cleanupMap]);

  // Handle container resize
  useEffect(() => {
    if (map.current && mapContainer.current) {
      console.log('Setting up resize observer');
      const resizeObserver = new ResizeObserver(() => {
        console.log('Container resized, calling map.resize()');
        map.current?.resize();
      });

      resizeObserver.observe(mapContainer.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [map.current]);

  // Debug: Log when loading state changes
  useEffect(() => {
    console.log('MapView loading state changed:', isLoading);
  }, [isLoading]);

  if (error) {
    console.log('MapView showing error:', error);
    return (
      <Box p={4} textAlign="center">
        <VStack gap={3}>
          <Text color="red.500" fontSize="sm">Error loading map</Text>
          <Text color="gray.500" fontSize="xs">{error}</Text>
        </VStack>
      </Box>
    );
  }

  if (isLoading) {
    console.log('MapView showing loading spinner');
    return (
      <Box p={4} textAlign="center">
        <VStack gap={3}>
          <Spinner size="md" />
          <Text color="gray.500" fontSize="sm">Loading map...</Text>
        </VStack>
      </Box>
    );
  }

  console.log('MapView rendering map container');
  return (
    <Box
      ref={mapContainer}
      height={height}
      width="100%"
      position="relative"
      borderRadius="md"
      overflow="hidden"
      border="1px solid #e2e8f0"
      bg="gray.50"
    />
  );
}
