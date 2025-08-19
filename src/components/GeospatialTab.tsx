'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useDgraph } from '@/context/DgraphContext';
import { Box, VStack, HStack, Text, Button, Card, Heading, Badge, Spinner, Alert } from '@chakra-ui/react';
import { Icons } from '@/components/ui/icons';

interface GeospatialQueryResult {
  uid: string;
  type: string;
  geometry: any;
  geometryPredicate: string;
  properties: Record<string, any>;
}

interface DashboardStats {
  totalNodes: number;
  nodeTypes: Record<string, number>;
  propertyAggregations: Record<string, any>;
}

const GeospatialTab: React.FC = () => {
  const { dgraphService, connected } = useDgraph();
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [queryResults, setQueryResults] = useState<GeospatialQueryResult[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle] = useState<string>('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json');
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'point' | 'line'>('polygon');
  const [discoveredPredicates, setDiscoveredPredicates] = useState<string[]>([]);
  const [activePredicate, setActivePredicate] = useState<string>('');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-74.006, 40.7128],
      zoom: 10
    });

    mapRef.current = map;

    // Wait for map to load before adding controls
    map.on('load', () => {
      // Add navigation controls
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Add drawing controls
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          point: true,
          line: true,
          trash: true
        }
      });

      map.addControl(draw);
      drawRef.current = draw;

      // Handle draw events using the correct API
      map.on('draw.create', (e: any) => {
        console.log('✏️ Draw create event:', e);
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          console.log('🎯 Created feature:', {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates,
            properties: feature.properties
          });
          if (feature.geometry.type === 'Polygon') {
            setDrawnPolygon(feature.geometry as GeoJSON.Polygon);
            console.log('✅ Polygon set for querying');
          }
        }
      });

      map.on('draw.delete', (e: any) => {
        console.log('🗑️ Draw delete event:', e);
        setDrawnPolygon(null);
        console.log('❌ Polygon cleared');
      });

      map.on('draw.update', (e: any) => {
        console.log('✏️ Draw update event:', e);
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          console.log('🔄 Updated feature:', {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates
          });
          if (feature.geometry.type === 'Polygon') {
            setDrawnPolygon(feature.geometry as GeoJSON.Polygon);
            console.log('✅ Polygon updated for querying');
          }
        }
      });

      // Set initial drawing mode
      draw.changeMode('draw_polygon');
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [mapStyle]);

  // Handle drawing mode changes
  useEffect(() => {
    if (!drawRef.current) return;

    switch (drawingMode) {
      case 'polygon':
        drawRef.current.changeMode('draw_polygon');
        break;
      case 'point':
        drawRef.current.changeMode('draw_point');
        break;
      case 'line':
        drawRef.current.changeMode('draw_line_string');
        break;
    }
  }, [drawingMode]);

  // Discover geospatial predicates in the database
  const discoverGeospatialPredicates = useCallback(async () => {
    if (!dgraphService || !connected) return [];

    try {
      console.log('🔍 Discovering geospatial predicates...');
      
      // Use a simpler approach - just check for common geospatial predicates
      const potentialGeoPredicates: string[] = [];
      
      // Common geospatial predicate names to check
      const commonGeoPredicates = [
        'geometry', 'location', 'coordinates', 'boundary', 'area', 'shape',
        'geo', 'spatial', 'lat', 'lng', 'lon', 'latitude', 'longitude',
        'point', 'polygon', 'line', 'multipoint', 'multipolygon', 'multilinestring'
      ];
      
      // Test each potential predicate
      for (const predName of commonGeoPredicates) {
        try {
          console.log(`🔍 Testing predicate: ${predName}`);
          const testQuery = `{
            q(func: has(${predName}), first: 1) {
              uid
              dgraph.type
              ${predName}
            }
          }`;
          
          const result = await dgraphService.query(testQuery);
          
          if (result.data && result.data.q && result.data.q.length > 0) {
            console.log(`✅ Found predicate: ${predName}`);
            potentialGeoPredicates.push(predName);
          } else {
            console.log(`❌ No data for predicate: ${predName}`);
          }
        } catch (error) {
          console.log(`⚠️ Predicate ${predName} test failed:`, error);
          // Continue testing other predicates
        }
      }
      
      // Also try to find any predicates that might contain geospatial data
      try {
        console.log('🔍 Checking for any nodes with potential geospatial data...');
        const sampleQuery = `{
          q(func: has(dgraph.type), first: 10) {
            uid
            dgraph.type
            expand(_all_) {
              uid
              dgraph.type
            }
          }
        }`;
        
        const sampleResult = await dgraphService.query(sampleQuery);
        
        if (sampleResult.data && sampleResult.data.q) {
          sampleResult.data.q.forEach((node: any) => {
            Object.keys(node).forEach(key => {
              if (key !== 'uid' && key !== 'dgraph.type' && !potentialGeoPredicates.includes(key)) {
                // Check if this predicate might contain geospatial data
                const value = node[key];
                if (value && (
                  typeof value === 'string' && (
                    value.includes('POINT') ||
                    value.includes('POLYGON') ||
                    value.includes('LINESTRING') ||
                    value.includes('MULTIPOINT') ||
                    value.includes('MULTIPOLYGON') ||
                    value.includes('MULTILINESTRING')
                  )
                )) {
                  console.log(`🎯 Found potential geospatial predicate: ${key} with value: ${value}`);
                  potentialGeoPredicates.push(key);
                }
              }
            });
          });
        }
      } catch (sampleError) {
        console.log('⚠️ Sample data check failed:', sampleError);
      }

      // Remove duplicates and filter out empty names
      const uniquePredicates = [...new Set(potentialGeoPredicates)].filter(name => name && name.trim() !== '');
      
      console.log('🎯 Discovered potential geospatial predicates:', uniquePredicates);
      return uniquePredicates;
      
    } catch (error) {
      console.error('❌ Failed to discover geospatial predicates:', error);
      return [];
    }
  }, [dgraphService, connected]);

  // Execute geospatial query with discovered predicates
  const executeGeospatialQuery = useCallback(async () => {
    if (!drawnPolygon || !dgraphService || !connected) {
      setError('No polygon drawn or not connected to database');
      return;
    }

    setIsQuerying(true);
    setError(null);

    try {
      // Convert polygon to DQL geospatial query
      const coordinates = drawnPolygon.coordinates[0];
      
      // Validate polygon coordinates
      if (!coordinates || coordinates.length < 3) {
        throw new Error('Invalid polygon: must have at least 3 coordinates');
      }
      
      // Check for valid coordinate ranges
      const validCoordinates = coordinates.every(coord => 
        Array.isArray(coord) && 
        coord.length === 2 && 
        typeof coord[0] === 'number' && 
        typeof coord[1] === 'number' &&
        coord[0] >= -180 && coord[0] <= 180 && // longitude range
        coord[1] >= -90 && coord[1] <= 90      // latitude range
      );
      
      if (!validCoordinates) {
        throw new Error('Invalid coordinates: must be valid lat/lng pairs');
      }
      
      const polygonString = coordinates.map(coord => `${coord[1]} ${coord[0]}`).join(', ');
      
      // Ensure polygon is closed (first and last coordinates should be the same)
      const isClosed = coordinates[0][0] === coordinates[coordinates.length - 1][0] && 
                       coordinates[0][1] === coordinates[coordinates.length - 1][1];
      
      if (!isClosed) {
        console.log('⚠️ Polygon not closed, adding closing coordinate');
        coordinates.push([...coordinates[0]]); // Add closing coordinate
      }
      
      // Validate the polygon string
      if (!polygonString || polygonString.trim() === '') {
        throw new Error('Invalid polygon string generated');
      }

      // Discover geospatial predicates
      const geoPredicates = await discoverGeospatialPredicates();
      
      if (geoPredicates.length === 0) {
        throw new Error('No geospatial predicates found in database. Please ensure your data has geometry or location predicates.');
      }

      setDiscoveredPredicates(geoPredicates);
      console.log('🌍 Executing Geospatial Query with discovered predicates:', geoPredicates);
      console.log('📍 Drawn Polygon Coordinates:', coordinates);
      console.log('📊 Query Parameters:', {
        polygonString,
        coordinateCount: coordinates.length,
        boundingBox: {
          minLng: Math.min(...coordinates.map(c => c[0])),
          maxLng: Math.max(...coordinates.map(c => c[0])),
          minLat: Math.min(...coordinates.map(c => c[1])),
          maxLat: Math.max(...coordinates.map(c => c[1]))
        }
      });

      // Generate queries for each discovered predicate
      const queries = geoPredicates.map(predicate => {
        // Use a safer approach - create the query with proper escaping
        const safePredicate = predicate.replace(/[^a-zA-Z0-9_]/g, '_');
        
        return {
          predicate,
          safePredicate,
          query: `{
            q(func: has(${safePredicate})) @filter(within(${safePredicate}, "POLYGON((${polygonString}))")) {
              uid
              dgraph.type
              ${safePredicate}
              expand(_all_)
            }
          }`
        };
      });

      console.log('🔍 Generated queries for each predicate:', queries);

      // Try each query until one succeeds
      let result;
      let successfulPredicate = '';
      
      for (const { predicate, safePredicate, query: queryString } of queries) {
        try {
          console.log(`🚀 Trying query with predicate: ${predicate} (safe: ${safePredicate})`);
          console.log(`📝 Query string:`, queryString);
          
          result = await dgraphService.query(queryString);
          
          if (result.data && result.data.q && result.data.q.length > 0) {
            console.log(`✅ Query succeeded with predicate: ${predicate}`);
            successfulPredicate = predicate;
            setActivePredicate(predicate);
            break;
          } else {
            console.log(`⚠️ Query with predicate ${predicate} returned no results`);
          }
        } catch (queryError) {
          console.log(`❌ Query with predicate ${predicate} failed:`, queryError);
          continue;
        }
      }

      if (!result || !result.data || !result.data.q) {
        // Try a very simple fallback query
        console.log('⚠️ All predicate-specific queries failed, trying simple fallback...');
        
        try {
          const fallbackQuery = `{
            q(func: has(dgraph.type), first: 100) {
              uid
              dgraph.type
              expand(_all_)
            }
          }`;
          
          console.log('🔄 Trying fallback query:', fallbackQuery);
          const fallbackResult = await dgraphService.query(fallbackQuery);
          
          if (fallbackResult.data && fallbackResult.data.q && fallbackResult.data.q.length > 0) {
            console.log('✅ Fallback query succeeded, but no geospatial filtering applied');
            result = fallbackResult;
            successfulPredicate = 'fallback';
            setActivePredicate('fallback');
          } else {
            throw new Error('Fallback query also failed');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback query failed:', fallbackError);
          throw new Error(`All geospatial queries failed. Tried predicates: ${geoPredicates.join(', ')}`);
        }
      }

      console.log('📡 Raw Dgraph Response:', result);
      console.log('✅ Successful predicate:', successfulPredicate);
      
      // Check for Dgraph errors
      if (result.errors && result.errors.length > 0) {
        console.error('❌ Dgraph returned errors:', result.errors);
        throw new Error(`Dgraph query errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }
      
      if (result.data && result.data.q) {
        const results = result.data.q.map((node: any) => {
          // Find the actual geometry predicate used
          const geometryPredicate = geoPredicates.find(pred => node[pred]);
          const geometryData = geometryPredicate ? node[geometryPredicate] : null;
          
          return {
            uid: node.uid,
            type: node['dgraph.type']?.[0] || 'unknown',
            geometry: geometryData,
            geometryPredicate: geometryPredicate || 'unknown',
            properties: Object.fromEntries(
              Object.entries(node).filter(([key]) => 
                !['uid', 'dgraph.type', geometryPredicate].includes(key)
              )
            )
          };
        });

        console.log('✅ Processed Query Results:');
        console.log('📈 Total Results:', results.length);
        console.log('🏷️ Node Types Found:', [...new Set(results.map((r: GeospatialQueryResult) => r.type))]);
        console.log('🗺️ Geometry Predicates Used:', [...new Set(results.map((r: GeospatialQueryResult) => r.geometryPredicate))]);
        console.log('🔍 Sample Results:', results.slice(0, 3));
        console.log('📊 Full Results:', results);

        setQueryResults(results);
        updateDashboardStats(results);
        
        // Add results to map
        addResultsToMap(results);
      } else {
        console.log('⚠️ No results found in response');
        console.log('📋 Response structure:', Object.keys(result));
        if (result.data) {
          console.log('📊 Available data keys:', Object.keys(result.data));
        }
      }
    } catch (err) {
      console.error('❌ Geospatial Query Failed:', err);
      setError(`Query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsQuerying(false);
    }
  }, [drawnPolygon, dgraphService, connected]);

  // Add query results to map
  const addResultsToMap = (results: GeospatialQueryResult[]) => {
    if (!mapRef.current) return;

    console.log('🗺️ Adding results to map:', results.length, 'features');

    // Remove existing results layer if it exists
    if (mapRef.current.getSource('query-results')) {
      console.log('🗑️ Removing existing map layers');
      mapRef.current.removeLayer('results-points');
      mapRef.current.removeLayer('results-polygons');
      mapRef.current.removeLayer('results-lines');
      mapRef.current.removeSource('query-results');
    }

    // Add new results as GeoJSON source
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: results.map(result => ({
        type: 'Feature',
        geometry: result.geometry,
        properties: {
          uid: result.uid,
          type: result.type,
          ...result.properties
        }
      }))
    };

    console.log('📊 GeoJSON data for map:', geojsonData);
    console.log('🔍 Geometry types found:', [...new Set(results.map(r => r.geometry?.type))]);

    mapRef.current.addSource('query-results', {
      type: 'geojson',
      data: geojsonData
    });

    // Add layers for different geometry types
    mapRef.current.addLayer({
      id: 'results-points',
      type: 'circle',
      source: 'query-results',
      paint: {
        'circle-radius': 8,
        'circle-color': '#3B82F6',
        'circle-stroke-color': '#1E40AF',
        'circle-stroke-width': 2
      },
      filter: ['==', '$type', 'Point']
    });

    mapRef.current.addLayer({
      id: 'results-polygons',
      type: 'fill',
      source: 'query-results',
      paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.6,
        'fill-outline-color': '#1E40AF'
      },
      filter: ['==', '$type', 'Polygon']
    });

    mapRef.current.addLayer({
      id: 'results-lines',
      type: 'line',
      source: 'query-results',
      paint: {
        'line-color': '#3B82F6',
        'line-width': 3
      },
      filter: ['==', '$type', 'LineString']
    });

    console.log('✅ Map layers added successfully');
  };

  // Update dashboard statistics
  const updateDashboardStats = (results: GeospatialQueryResult[]) => {
    console.log('📊 Updating dashboard statistics for', results.length, 'results');
    
    const stats: DashboardStats = {
      totalNodes: results.length,
      nodeTypes: {},
      propertyAggregations: {}
    };

    results.forEach(result => {
      // Count node types
      const type = result.type;
      stats.nodeTypes[type] = (stats.nodeTypes[type] || 0) + 1;

      // Aggregate property values
      Object.entries(result.properties).forEach(([key, value]) => {
        if (!stats.propertyAggregations[key]) {
          stats.propertyAggregations[key] = {
            count: 0,
            values: new Set(),
            numericValues: []
          };
        }
        
        stats.propertyAggregations[key].count++;
        if (typeof value === 'string' || typeof value === 'number') {
          stats.propertyAggregations[key].values.add(value);
        }
        if (typeof value === 'number') {
          stats.propertyAggregations[key].numericValues.push(value);
        }
      });
    });

    console.log('📈 Dashboard Stats:', {
      totalNodes: stats.totalNodes,
      nodeTypes: stats.nodeTypes,
      propertyCount: Object.keys(stats.propertyAggregations).length,
      sampleProperties: Object.keys(stats.propertyAggregations).slice(0, 5)
    });

    setDashboardStats(stats);
  };

  // Clear results
  const clearResults = () => {
    setQueryResults([]);
    setDashboardStats(null);
    setError(null);
    
    // Remove results from map
    if (mapRef.current && mapRef.current.getSource('query-results')) {
      mapRef.current.removeLayer('results-points');
      mapRef.current.removeLayer('results-polygons');
      mapRef.current.removeLayer('results-lines');
      mapRef.current.removeSource('query-results');
    }
  };

  // Clear drawn polygon
  const clearPolygon = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
    setDrawnPolygon(null);
  };

  if (!connected) {
    return (
      <Box p={6}>
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Title>Not Connected</Alert.Title>
          <Alert.Description>
            Please connect to a Dgraph database to use geospatial features.
          </Alert.Description>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading textStyle="heading.section" mb={3}>
          Geospatial Analysis
        </Heading>
        <Text textStyle="body.medium">
          Interactive map-based exploration of geospatial data in your Dgraph database
        </Text>
      </Box>

      <HStack gap={4} align="start">
        {/* Map Section */}
        <Card.Root variant="elevated" flex={1}>
          <Card.Header>
            <HStack justify="space-between" align="center">
              <Heading size="md">Interactive Map</Heading>
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant={drawingMode === 'polygon' ? 'solid' : 'outline'}
                  onClick={() => setDrawingMode('polygon')}
                >
                  <Icons.polygon size={16} />
                  Polygon
                </Button>
                <Button
                  size="sm"
                  variant={drawingMode === 'point' ? 'solid' : 'outline'}
                  onClick={() => setDrawingMode('point')}
                >
                  <Icons.point size={16} />
                  Point
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearPolygon}
                >
                  Clear
                </Button>
              </HStack>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Box h="500px" position="relative">
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

              {/* Query Controls Overlay */}
              <Box
                position="absolute"
                bottom={4}
                left={4}
                bg="white"
                p={3}
                borderRadius="md"
                shadow="lg"
                border="1px"
                borderColor="gray.200"
              >
                <VStack gap={2} align="start">
                  <Text fontSize="sm" fontWeight="medium">
                    {drawnPolygon ? 'Polygon drawn' : 'Draw a polygon to query'}
                  </Text>
                  
                  {discoveredPredicates.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Discovered predicates: {discoveredPredicates.join(', ')}
                      </Text>
                      {activePredicate && (
                        <Text fontSize="xs" color="green.600">
                          Using: {activePredicate}
                        </Text>
                      )}
                    </Box>
                  )}
                  
                  {drawnPolygon && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={executeGeospatialQuery}
                      loading={isQuerying}
                    >
                      {isQuerying ? 'Querying...' : 'Execute Query'}
                    </Button>
                  )}
                </VStack>
              </Box>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* Dashboard Section */}
        <Card.Root variant="elevated" w="400px">
          <Card.Header>
            <Heading size="md">Query Dashboard</Heading>
          </Card.Header>
          <Card.Body>
            {error && (
              <Alert.Root status="error" mb={4}>
                <Alert.Indicator />
                <Alert.Description>{error}</Alert.Description>
              </Alert.Root>
            )}

            {isQuerying && (
              <HStack justify="center" py={8}>
                <Spinner size="lg" />
                <Text>Executing geospatial query...</Text>
              </HStack>
            )}

            {dashboardStats && (
              <VStack gap={4} align="stretch">
                {/* Summary Stats */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Summary
                  </Text>
                  <HStack gap={4}>
                    <Badge colorScheme="blue" variant="subtle">
                      {dashboardStats.totalNodes} nodes
                    </Badge>
                    <Badge colorScheme="green" variant="subtle">
                      {Object.keys(dashboardStats.nodeTypes).length} types
                    </Badge>
                  </HStack>
                </Box>

                {/* Node Types */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Node Types
                  </Text>
                  <VStack gap={2} align="stretch">
                    {Object.entries(dashboardStats.nodeTypes).map(([type, count]) => (
                      <HStack key={type} justify="space-between">
                        <Text fontSize="sm">{type}</Text>
                        <Badge variant="outline">{count}</Badge>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {/* Property Aggregations */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Property Analysis
                  </Text>
                  <VStack gap={2} align="stretch">
                    {Object.entries(dashboardStats.propertyAggregations).map(([prop, stats]) => (
                      <Box key={prop} p={2} bg="gray.50" borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">{prop}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {stats.count} occurrences, {stats.values.size} unique values
                        </Text>
                        {stats.numericValues.length > 0 && (
                          <Text fontSize="xs" color="gray.600">
                            Range: {Math.min(...stats.numericValues)} - {Math.max(...stats.numericValues)}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Button
                  variant="outline"
                  onClick={clearResults}
                  size="sm"
                >
                  Clear Results
                </Button>
              </VStack>
            )}

            {!dashboardStats && !isQuerying && (
              <Box textAlign="center" py={8} color="gray.500">
                <Icons.map size={32} />
                <Text mt={2} fontSize="sm">
                  Draw a polygon on the map and execute a query to see results here
                </Text>
              </Box>
            )}
          </Card.Body>
        </Card.Root>
      </HStack>

      {/* Query Results Table */}
      {queryResults.length > 0 && (
        <Card.Root variant="elevated">
          <Card.Header>
            <Heading size="md">Query Results ({queryResults.length})</Heading>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queryResults.map((result) => (
                    <tr key={result.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {result.uid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="outline">{result.type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {Object.entries(result.properties).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="font-medium text-gray-700">{key}:</span>
                              <span className="text-gray-600">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default GeospatialTab;
