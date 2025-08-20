'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  allLocationFields: Record<string, any>;
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'uid' | 'type' | 'properties'>('uid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFeature, setSelectedFeature] = useState<GeoJSON.Feature | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ lng: number; lat: number } | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  // Monitor state changes for debugging
  useEffect(() => {
    console.log('🔄 State changed - selectedFeature:', selectedFeature ? 'YES' : 'NO');
    console.log('🔄 State changed - popupPosition:', popupPosition ? 'YES' : 'NO');
  }, [selectedFeature, popupPosition]);

  // Helper functions for geometry processing
  
  // Validate and format DQL polygon string for Dgraph geospatial queries
  const formatDQLPolygon = (coordinates: number[][]): string => {
    try {
      if (!coordinates || coordinates.length < 3) {
        throw new Error('Polygon must have at least 3 coordinates');
      }
      
      // Ensure coordinates are in [longitude, latitude] format
      const validCoords = coordinates.every(coord => 
        Array.isArray(coord) && 
        coord.length === 2 && 
        typeof coord[0] === 'number' && 
        typeof coord[1] === 'number' &&
        coord[0] >= -180 && coord[0] <= 180 && // longitude range
        coord[1] >= -90 && coord[1] <= 90      // latitude range
      );
      
      if (!validCoords) {
        throw new Error('Invalid coordinate ranges: longitude must be -180 to 180, latitude must be -90 to 90');
      }
      
      // Dgraph within() function expects a nested array format: [[[lng, lat], [lng, lat], ...]]
      // Ensure polygon is closed
      const firstCoord = coordinates[0];
      const lastCoord = coordinates[coordinates.length - 1];
      
      let finalCoordinates = [...coordinates];
      if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
        console.log('⚠️ Polygon not closed, adding closing coordinate');
        finalCoordinates.push([...firstCoord]);
      }
      
      // Convert to nested array format for Dgraph
      const nestedArray = `[[${finalCoordinates.map(coord => `[${coord[0]}, ${coord[1]}]`).join(', ')}]]`;
      
      console.log('📍 Formatted DQL polygon for Dgraph within():', nestedArray);
      console.log('📍 Note: Dgraph expects nested array format: [[[lng, lat], [lng, lat], ...]]');
      return nestedArray;
    } catch (error) {
      console.error('❌ Error formatting DQL polygon:', error);
      throw error;
    }
  };
  
  const parseWKTGeometry = (wkt: string): GeoJSON.Geometry | null => {
    try {
      console.log('🔍 Parsing WKT geometry:', wkt);

      // Handle common WKT formats
      if (wkt.toUpperCase().startsWith('POINT(')) {
        const coords = wkt.match(/POINT\(([^)]+)\)/i)?.[1];
        if (coords) {
          const [lng, lat] = coords.split(/\s+/).map(Number);
          if (!isNaN(lng) && !isNaN(lat)) {
            return {
              type: 'Point',
              coordinates: [lng, lat]
            };
          }
        }
      } else if (wkt.toUpperCase().startsWith('POLYGON(')) {
        const coords = wkt.match(/POLYGON\(\(([^)]+)\)\)/i)?.[1];
        if (coords) {
          const rings = coords.split(/\),\s*\(/).map(ring =>
            ring.replace(/[()]/g, '').split(',').map(coord => {
              const [lng, lat] = coord.trim().split(/\s+/).map(Number);
              return [lng, lat];
            })
          );
          if (rings.length > 0 && rings[0].length >= 3) {
            return {
              type: 'Polygon',
              coordinates: rings
            };
          }
        }
      } else if (wkt.toUpperCase().startsWith('LINESTRING(')) {
        const coords = wkt.match(/LINESTRING\(([^)]+)\)/i)?.[1];
        if (coords) {
          const points = coords.split(',').map(coord => {
            const [lng, lat] = coord.trim().split(/\s+/).map(Number);
            return [lng, lat];
          });
          if (points.length >= 2) {
            return {
              type: 'LineString',
              coordinates: points
            };
          }
        }
      }

      console.warn('⚠️ Unsupported WKT format:', wkt);
      return null;
    } catch (error) {
      console.error('❌ Error parsing WKT:', error);
      return null;
    }
  };

  const isValidGeoJSONGeometry = (geometry: any): geometry is GeoJSON.Geometry => {
    if (!geometry || typeof geometry !== 'object') return false;

    const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    if (!validTypes.includes(geometry.type)) return false;

    if (!Array.isArray(geometry.coordinates)) return false;

    // Basic validation for different geometry types
    switch (geometry.type) {
      case 'Point':
        return geometry.coordinates.length === 2 &&
               typeof geometry.coordinates[0] === 'number' &&
               typeof geometry.coordinates[1] === 'number';
      case 'LineString':
        return geometry.coordinates.length >= 2 &&
               geometry.coordinates.every((coord: any) =>
                 Array.isArray(coord) && coord.length === 2 &&
                 typeof coord[0] === 'number' && typeof coord[1] === 'number'
               );
      case 'Polygon':
        return geometry.coordinates.length >= 1 &&
               geometry.coordinates.every((ring: any) =>
                 Array.isArray(ring) && ring.length >= 3 &&
                 ring.every((coord: any) =>
                   Array.isArray(coord) && coord.length === 2 &&
                   typeof coord[0] === 'number' && typeof coord[1] === 'number'
                 )
               );
      default:
        return true; // For other types, just check basic structure
    }
  };

  const convertToGeoJSON = (geometry: any): GeoJSON.Geometry | null => {
    try {
      console.log('🔍 Attempting to convert geometry:', geometry);

      // Handle common Dgraph geometry formats
      if (geometry.lat && geometry.lng) {
        return {
          type: 'Point',
          coordinates: [geometry.lng, geometry.lat]
        };
      } else if (geometry.latitude && geometry.longitude) {
        return {
          type: 'Point',
          coordinates: [geometry.longitude, geometry.latitude]
        };
      } else if (geometry.coordinates && Array.isArray(geometry.coordinates)) {
        // Might already be GeoJSON format
        if (isValidGeoJSONGeometry(geometry)) {
          return geometry;
        }
      } else if (geometry.x && geometry.y) {
        // Handle x,y coordinate format
        return {
          type: 'Point',
          coordinates: [geometry.x, geometry.y]
        };
      }

      console.warn('⚠️ Could not convert geometry format:', geometry);
      return null;
    } catch (error) {
      console.error('❌ Error converting geometry:', error);
      return null;
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: maplibregl.Map;

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [-74.006, 40.7128],
        zoom: 10
      });

      mapRef.current = map;
      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      return;
    }

    // Wait for map to load before adding controls
    map.on('load', () => {
      try {
        // Add navigation controls
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        console.log('✅ Navigation controls added successfully');
      } catch (error) {
        console.error('❌ Error adding navigation controls:', error);
      }

      // Add drawing controls with custom styling to fix MapLibre compatibility
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          point: true,
          line: true,
          trash: true
        },
        // Custom styles to fix MapLibre compatibility issues
        styles: [
          // Active (being drawn) styles
          {
            "id": "gl-draw-polygon-fill-active",
            "type": "fill",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
            "paint": {
              "fill-color": "#3bb2d0",
              "fill-outline-color": "#3bb2d0",
              "fill-opacity": 0.1
            }
          },
          {
            "id": "gl-draw-polygon-stroke-active",
            "type": "line",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#3bb2d0",
              "line-dasharray": ["literal", [0.2, 2]],
              "line-width": 2
            }
          },
          // Inactive styles
          {
            "id": "gl-draw-polygon-fill-inactive",
            "type": "fill",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
            "paint": {
              "fill-color": "#3bb2d0",
              "fill-outline-color": "#3bb2d0",
              "fill-opacity": 0.1
            }
          },
          {
            "id": "gl-draw-polygon-stroke-inactive",
            "type": "line",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#3bb2d0",
              "line-width": 1
            }
          },
          // Point styles
          {
            "id": "gl-draw-point-point-active",
            "type": "circle",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "Point"]],
            "paint": {
              "circle-radius": 7,
              "circle-color": "#fff"
            }
          },
          {
            "id": "gl-draw-point-point-inactive",
            "type": "circle",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Point"]],
            "paint": {
              "circle-radius": 5,
              "circle-color": "#fff"
            }
          },
          // Line styles
          {
            "id": "gl-draw-line-active",
            "type": "line",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "LineString"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#3bb2d0",
              "line-dasharray": ["literal", [0.2, 2]],
              "line-width": 2
            }
          },
          {
            "id": "gl-draw-line-inactive",
            "type": "line",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "LineString"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#3bb2d0",
              "line-width": 1
            }
          }
        ]
      });

      try {
        map.addControl(draw);
        drawRef.current = draw;
        console.log('✅ Drawing controls added successfully');
      } catch (error) {
        console.error('❌ Error adding drawing controls:', error);
        // Fallback: try to add without custom styles
        try {
          const fallbackDraw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              point: true,
              line: true,
              trash: true
            }
          });
          map.addControl(fallbackDraw);
          drawRef.current = fallbackDraw;
          console.log('✅ Drawing controls added with fallback configuration');
        } catch (fallbackError) {
          console.error('❌ Fallback drawing controls also failed:', fallbackError);
        }
      }

      // Handle draw events using the correct API
      try {
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
        console.log('✅ Draw create event listener added');
      } catch (error) {
        console.error('❌ Error adding draw create event listener:', error);
      }

      try {
        map.on('draw.delete', (e: any) => {
          console.log('🗑️ Draw delete event:', e);
          setDrawnPolygon(null);
          console.log('❌ Polygon cleared');
        });
        console.log('✅ Draw delete event listener added');
      } catch (error) {
        console.error('❌ Error adding draw delete event listener:', error);
      }

      try {
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
        console.log('✅ Draw update event listener added');
      } catch (error) {
        console.error('❌ Error adding draw update event listener:', error);
      }

      // Set initial drawing mode
      try {
        draw.changeMode('draw_polygon');
        console.log('✅ Initial drawing mode set to polygon');
      } catch (error) {
        console.error('❌ Error setting initial drawing mode:', error);
      }
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

    try {
      switch (drawingMode) {
        case 'polygon':
          drawRef.current.changeMode('draw_polygon');
          console.log('✅ Drawing mode changed to polygon');
          break;
        case 'point':
          drawRef.current.changeMode('draw_point');
          console.log('✅ Drawing mode changed to point');
          break;
        case 'line':
          drawRef.current.changeMode('draw_line_string');
          console.log('✅ Drawing mode changed to line');
          break;
      }
    } catch (error) {
      console.error('❌ Error changing drawing mode:', error);
    }
  }, [drawingMode]);

  // Discover geospatial predicates in the database
  const discoverGeospatialPredicates = useCallback(async () => {
    if (!dgraphService || !connected) return [];

    try {
      console.log('🔍 Discovering geospatial predicates...');
      
      const potentialGeoPredicates: string[] = [];
      
      // Enhanced list of geospatial predicate patterns
      const geoPatterns = [
        // Direct geometry predicates
        'geometry', 'location', 'coordinates', 'boundary', 'area', 'shape',
        'geo', 'spatial', 'geom', 'polygon', 'point', 'line', 'multipoint', 
        'multipolygon', 'multilinestring', 'linestring',
        
        // Coordinate predicates
        'lat', 'lng', 'lon', 'latitude', 'longitude', 'x', 'y',
        
        // Address and location predicates
        'address', 'street', 'city', 'state', 'country', 'zip', 'postal',
        'neighborhood', 'district', 'region', 'province', 'county',
        
        // Building and infrastructure predicates
        'building', 'floor', 'room', 'zone', 'section', 'block',
        
        // Natural feature predicates
        'landmark', 'mountain', 'river', 'lake', 'forest', 'park',
        
        // Custom predicates that might contain geo data
        'position', 'placement', 'site', 'venue', 'facility'
      ];
      
      // Test each potential predicate with a more comprehensive query
      for (const predName of geoPatterns) {
        try {
          console.log(`🔍 Testing predicate: ${predName}`);
          
          // Try to find nodes with this predicate and check their values
          const testQuery = `{
            q(func: has(${predName}), first: 5) {
              uid
              dgraph.type
              ${predName}
              expand(_all_) {
                uid
                dgraph.type
              }
            }
          }`;
          
          const result = await dgraphService.query(testQuery);
          
          if (result.data && result.data.q && result.data.q.length > 0) {
            console.log(`✅ Found predicate: ${predName}`);
            
            // Check if the predicate actually contains geospatial data
            const hasGeoData = result.data.q.some((node: any) => {
              const value = node[predName];
              if (!value) return false;
              
              // Check for WKT format
              if (typeof value === 'string') {
                return value.toUpperCase().includes('POINT') ||
                       value.toUpperCase().includes('POLYGON') ||
                       value.toUpperCase().includes('LINESTRING') ||
                       value.toUpperCase().includes('MULTIPOINT') ||
                       value.toUpperCase().includes('MULTIPOLYGON') ||
                       value.toUpperCase().includes('MULTILINESTRING');
              }
              
              // Check for coordinate objects
              if (typeof value === 'object' && value !== null) {
                return (value.lat && value.lng) ||
                       (value.latitude && value.longitude) ||
                       (value.x && value.y) ||
                       (value.coordinates && Array.isArray(value.coordinates));
              }
              
              return false;
            });
            
            if (hasGeoData) {
              console.log(`🎯 Predicate ${predName} contains actual geospatial data`);
              potentialGeoPredicates.push(predName);
            } else {
              console.log(`⚠️ Predicate ${predName} exists but contains no geospatial data`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Predicate ${predName} test failed:`, error);
        }
      }
      
      // Also try to find any predicates that might contain geospatial data by sampling
      try {
        console.log('🔍 Sampling nodes to discover additional geospatial predicates...');
        
        // Query for nodes with dgraph.type to get a sample
        const sampleQuery = `{
          q(func: has(dgraph.type), first: 20) {
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
                const value = node[key];
                
                // Check if this predicate might contain geospatial data
                if (value && (
                  // WKT format check
                  (typeof value === 'string' && (
                    value.includes('POINT') ||
                    value.includes('POLYGON') ||
                    value.includes('LINESTRING') ||
                    value.includes('MULTIPOINT') ||
                    value.includes('MULTIPOLYGON') ||
                    value.includes('MULTILINESTRING')
                  )) ||
                  // Coordinate object check
                  (typeof value === 'object' && value !== null && (
                    (value.lat && value.lng) ||
                    (value.latitude && value.longitude) ||
                    (value.x && value.y) ||
                    (value.coordinates && Array.isArray(value.coordinates))
                  ))
                )) {
                  console.log(`🎯 Found additional geospatial predicate: ${key} with value:`, value);
                  if (!potentialGeoPredicates.includes(key)) {
                    potentialGeoPredicates.push(key);
                  }
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
      
      console.log('🎯 Discovered geospatial predicates:', uniquePredicates);
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
      // Convert polygon to DQL geospatial query using the helper function
      const coordinates = drawnPolygon.coordinates[0];
      const polygonString = formatDQLPolygon(coordinates);
      
      console.log('📍 Original coordinates:', coordinates);
      console.log('📍 Generated DQL polygon string:', polygonString);
      console.log('📍 Coordinate format: longitude latitude (DQL standard)');

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

      // Generate comprehensive queries for each discovered predicate
      const queries = geoPredicates.map(predicate => {
        // Use a safer approach - create the query with proper escaping
        const safePredicate = predicate.replace(/[^a-zA-Z0-9_]/g, '_');
        
        return {
          predicate,
          safePredicate,
          query: `{
            q(func: has(${safePredicate})) @filter(within(${safePredicate}, "${polygonString}")) {
              uid
              dgraph.type
              ${safePredicate}
              # Include all other properties (this will include location fields without duplicates)
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
        // Try a comprehensive fallback query to find any geospatial data
        console.log('⚠️ All predicate-specific queries failed, trying comprehensive fallback...');
        
        try {
          // Try to find any nodes that might have geospatial data
          const fallbackQuery = `{
            q(func: has(dgraph.type), first: 200) {
              uid
              dgraph.type
              # Include all properties (this will include location fields without duplicates)
              expand(_all_)
            }
          }`;
          
          console.log('🔄 Trying comprehensive fallback query:', fallbackQuery);
          const fallbackResult = await dgraphService.query(fallbackQuery);
          
          if (fallbackResult.data && fallbackResult.data.q && fallbackResult.data.q.length > 0) {
            console.log('✅ Fallback query succeeded, filtering for geospatial data...');
            
            // Filter results to only include nodes with actual geospatial data
            const geoNodes = fallbackResult.data.q.filter((node: any) => {
              const locationFields = [
                'location', 'coordinates', 'geometry', 'boundary', 'area', 'shape',
                'lat', 'lng', 'latitude', 'longitude', 'x', 'y',
                'address', 'street', 'city', 'state', 'country', 'zip', 'postal',
                'neighborhood', 'district', 'region', 'province', 'county',
                'building', 'floor', 'room', 'zone', 'section', 'block',
                'landmark', 'mountain', 'river', 'lake', 'forest', 'park',
                'position', 'placement', 'site', 'venue', 'facility'
              ];
              
              return locationFields.some(field => {
                const value = node[field];
                if (!value) return false;
                
                // Check for WKT format
                if (typeof value === 'string') {
                  return value.toUpperCase().includes('POINT') ||
                         value.toUpperCase().includes('POLYGON') ||
                         value.toUpperCase().includes('LINESTRING') ||
                         value.toUpperCase().includes('MULTIPOINT') ||
                         value.toUpperCase().includes('MULTIPOLYGON') ||
                         value.toUpperCase().includes('MULTILINESTRING');
                }
                
                // Check for coordinate objects
                if (typeof value === 'object' && value !== null) {
                  return (value as any).lat && (value as any).lng ||
                         (value as any).latitude && (value as any).longitude ||
                         (value as any).x && (value as any).y ||
                         (value as any).coordinates && Array.isArray((value as any).coordinates);
                }
                
                return false;
              });
            });
            
            if (geoNodes.length > 0) {
              console.log(`✅ Found ${geoNodes.length} nodes with geospatial data in fallback query`);
              result = { data: { q: geoNodes } };
              successfulPredicate = 'fallback-filtered';
              setActivePredicate('fallback-filtered');
            } else {
              throw new Error('Fallback query found no geospatial data');
            }
          } else {
            throw new Error('Fallback query returned no results');
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
          // Find all location-related fields
          const locationFields = [
            'location', 'coordinates', 'geometry', 'boundary', 'area', 'shape',
            'lat', 'lng', 'latitude', 'longitude', 'x', 'y',
            'address', 'street', 'city', 'state', 'country', 'zip', 'postal',
            'neighborhood', 'district', 'region', 'province', 'county',
            'building', 'floor', 'room', 'zone', 'section', 'block',
            'landmark', 'mountain', 'river', 'lake', 'forest', 'park',
            'position', 'placement', 'site', 'venue', 'facility'
          ];
          
          // Find the primary geometry predicate used for the query
          const primaryGeometryPredicate = geoPredicates.find(pred => node[pred]);
          const primaryGeometryData = primaryGeometryPredicate ? node[primaryGeometryPredicate] : null;
          
          // Collect all location data from the node
          const allLocationData: Record<string, any> = {};
          locationFields.forEach(field => {
            if (node[field]) {
              allLocationData[field] = node[field];
            }
          });
          
          // Find the best geometry for map rendering (prioritize actual geometry over coordinates)
          let bestGeometry = primaryGeometryData;
          if (!bestGeometry) {
            // Look for any valid geometry data
            if (node.geometry) bestGeometry = node.geometry;
            else if (node.coordinates) bestGeometry = node.coordinates;
            else if (node.location) bestGeometry = node.location;
            else if (node.boundary) bestGeometry = node.boundary;
            else if (node.shape) bestGeometry = node.shape;
            else if (node.area) bestGeometry = node.area;
            else if ((node.lat && node.lng) || (node.latitude && node.longitude) || (node.x && node.y)) {
              // Create point from coordinates
              const lat = node.lat || node.latitude || node.y;
              const lng = node.lng || node.longitude || node.x;
              bestGeometry = { type: 'Point', coordinates: [lng, lat] };
            }
          }
          
          // Separate location fields from other properties
          const otherProperties = Object.fromEntries(
            Object.entries(node).filter(([key]) => 
              !['uid', 'dgraph.type', ...locationFields].includes(key)
            )
          );
          
          return {
            uid: node.uid,
            type: node['dgraph.type']?.[0] || 'unknown',
            geometry: bestGeometry,
            geometryPredicate: primaryGeometryPredicate || 'unknown',
            allLocationFields: allLocationData,
            properties: otherProperties
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
        try {
          addResultsToMap(results);
        } catch (error) {
          console.error('❌ Error adding results to map:', error);
          console.log('🔍 Results that failed to map:', results);
        }
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

    // Process and validate geometry data
    const validFeatures: GeoJSON.Feature[] = [];
    
    results.forEach((result, index) => {
      try {
        let geometry: GeoJSON.Geometry | null = null;
        
        // First try the primary geometry
        if (result.geometry) {
          if (typeof result.geometry === 'string') {
            geometry = parseWKTGeometry(result.geometry);
          } else if (typeof result.geometry === 'object') {
            if (isValidGeoJSONGeometry(result.geometry)) {
              geometry = result.geometry;
            } else {
              geometry = convertToGeoJSON(result.geometry);
            }
          }
        }
        
        // If no primary geometry, try to find geometry in location fields
        if (!geometry && result.allLocationFields) {
          const locationFields = ['geometry', 'coordinates', 'location', 'boundary', 'shape', 'area'];
          
          for (const field of locationFields) {
            if (result.allLocationFields[field]) {
              const value = result.allLocationFields[field];
              if (typeof value === 'string') {
                geometry = parseWKTGeometry(value);
              } else if (typeof value === 'object') {
                if (isValidGeoJSONGeometry(value)) {
                  geometry = value;
                } else {
                  geometry = convertToGeoJSON(value);
                }
              }
              if (geometry) break;
            }
          }
        }
        
        // If still no geometry, try to create from coordinate fields
        if (!geometry && result.allLocationFields) {
          const coordFields = ['lat', 'lng', 'latitude', 'longitude', 'x', 'y'];
          let lat: number | null = null;
          let lng: number | null = null;
          
          for (const field of coordFields) {
            if (result.allLocationFields[field] !== undefined) {
              if (field === 'lat' || field === 'latitude' || field === 'y') {
                lat = Number(result.allLocationFields[field]);
              } else if (field === 'lng' || field === 'longitude' || field === 'x') {
                lng = Number(result.allLocationFields[field]);
              }
            }
          }
          
          if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            geometry = {
              type: 'Point',
              coordinates: [lng, lat]
            };
            console.log(`📍 Created point geometry from coordinates: [${lng}, ${lat}]`);
          }
        }
        
        if (geometry) {
          validFeatures.push({
            type: 'Feature',
            geometry: geometry,
            properties: {
              uid: result.uid,
              type: result.type,
              geometryPredicate: result.geometryPredicate,
              allLocationFields: result.allLocationFields,
              ...result.properties
            }
          });
          console.log(`✅ Feature ${index} processed successfully:`, geometry.type);
        } else {
          console.warn(`⚠️ Feature ${index} has no valid geometry data:`, {
            geometry: result.geometry,
            locationFields: result.allLocationFields
          });
        }
      } catch (error) {
        console.error(`❌ Error processing feature ${index}:`, error);
        console.log('🔍 Feature data:', result);
      }
    });

    if (validFeatures.length === 0) {
      console.warn('⚠️ No valid features to display on map');
      console.log('🔍 Raw results for debugging:', results);
      
      // Show a message to the user that no valid geometries were found
      setError('No valid geospatial data found in query results. The data may not be in a supported format.');
      return;
    }

    // Create GeoJSON source with validated features
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: validFeatures
    };

    console.log('📊 Valid GeoJSON data for map:', geojsonData);
    console.log('🔍 Valid features count:', validFeatures.length);
    console.log('🔍 Geometry types found:', [...new Set(validFeatures.map(f => f.geometry.type))]);

    try {
      mapRef.current.addSource('query-results', {
        type: 'geojson',
        data: geojsonData
      });
      console.log('✅ GeoJSON source added successfully');
    } catch (error) {
      console.error('❌ Error adding GeoJSON source:', error);
      console.log('🔍 GeoJSON data that failed:', geojsonData);
      return;
    }

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
    console.log('✅ Added results-points layer');

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
    console.log('✅ Added results-polygons layer');

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
    console.log('✅ Added results-lines layer');

    // Add click event handlers for all geometry types
    mapRef.current.on('click', 'results-points', (e) => {
      console.log('📍 Clicked on results-points layer');
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        console.log('📍 Found feature in results-points:', feature);
        showFeaturePopup(feature, e.lngLat);
      }
    });

    mapRef.current.on('click', 'results-polygons', (e) => {
      console.log('📍 Clicked on results-polygons layer');
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        console.log('📍 Found feature in results-polygons:', feature);
        showFeaturePopup(feature, e.lngLat);
      }
    });

    mapRef.current.on('click', 'results-lines', (e) => {
      console.log('📍 Clicked on results-lines layer');
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        console.log('📍 Found feature in results-lines:', feature);
        showFeaturePopup(feature, e.lngLat);
      }
    });

    // Add click handler for map background to close popup
    mapRef.current.on('click', (e: any) => {
      console.log('📍 Map background clicked, features:', e.features);
      // Only close popup if clicking on empty space (no features)
      if (!e.features || e.features.length === 0) {
        console.log('📍 No features found, closing popup');
        closeFeaturePopup();
      }
    });

    // Add a global click handler to see if ANY clicks are being registered
    mapRef.current.on('click', (e: any) => {
      console.log('📍 GLOBAL MAP CLICK - Position:', e.lngLat, 'Features:', e.features?.length || 0);
      if (e.features && e.features.length > 0) {
        console.log('📍 GLOBAL CLICK - Feature details:', e.features[0]);
      }
    });

    // Change cursor to pointer when hovering over features
    mapRef.current.on('mouseenter', 'results-points', () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      }
    });

    mapRef.current.on('mouseenter', 'results-polygons', () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      }
    });

    mapRef.current.on('mouseenter', 'results-lines', () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      }
    });

    mapRef.current.on('mouseleave', 'results-points', () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    });

    mapRef.current.on('mouseleave', 'results-polygons', () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    });

    mapRef.current.on('mouseleave', 'results-lines', () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    });

    // Verify layers were added and are clickable
    setTimeout(() => {
      if (mapRef.current) {
        console.log('🔍 Checking if layers exist:');
        console.log('  - results-points:', mapRef.current.getLayer('results-points') ? '✅' : '❌');
        console.log('  - results-polygons:', mapRef.current.getLayer('results-polygons') ? '✅' : '❌');
        console.log('  - results-lines:', mapRef.current.getLayer('results-lines') ? '✅' : '❌');
        
        // Check if source exists
        console.log('  - query-results source:', mapRef.current.getSource('query-results') ? '✅' : '❌');
        
        // Check if features are in the source
        const source = mapRef.current.getSource('query-results') as any;
        if (source && source._data) {
          console.log('  - Features in source:', source._data.features?.length || 0);
        }
      }
    }, 100);

    console.log('✅ Map layers and click handlers added successfully');
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
  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = queryResults;
    
    // Apply search filter
    if (searchTerm) {
      filtered = queryResults.filter(result => 
        result.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.keys(result.properties).some(key => 
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(result.properties[key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'uid':
          aValue = a.uid;
          bValue = b.uid;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'properties':
          aValue = Object.keys(a.properties).length;
          bValue = Object.keys(b.properties).length;
          break;
        default:
          aValue = a.uid;
          bValue = b.uid;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  }, [queryResults, searchTerm, sortBy, sortOrder]);

  const clearResults = () => {
    setQueryResults([]);
    setDashboardStats(null);
    setError(null);
    setSearchTerm('');
    setSelectedFeature(null);
    setPopupPosition(null);
    
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

  // Show feature popup when clicked
  const showFeaturePopup = useCallback((feature: GeoJSON.Feature, lngLat: { lng: number; lat: number }) => {
    console.log('📍 Feature clicked:', feature);
    console.log('📍 Setting popup state - selectedFeature:', feature);
    console.log('📍 Setting popup state - popupPosition:', lngLat);
    
    // Force immediate state update
    setSelectedFeature(feature);
    setPopupPosition(lngLat);
    
    // Log the state after setting it
    console.log('📍 Popup state should now be visible');
    
    // Force a re-render by updating a dummy state
    setTimeout(() => {
      console.log('📍 After timeout - selectedFeature:', feature);
      console.log('📍 After timeout - popupPosition:', lngLat);
    }, 100);
  }, []);

  // Close feature popup
  const closeFeaturePopup = useCallback(() => {
    setSelectedFeature(null);
    setPopupPosition(null);
  }, []);

  // Test DQL polygon format
  const testDQLPolygonFormat = useCallback(() => {
    console.log('🧪 Testing Dgraph geospatial polygon format...');
    
    // Test with your coordinates from the error
    const testCoords = [
      [42.67524108527863, -74.28183348865907],
      [42.94665831876094, -70.42968036261611],
      [40.51079526751644, -71.03906051814818],
      [42.67524108527863, -74.28183348865907]
    ];
    
    console.log('📍 Test coordinates (lat, lng):', testCoords);
    
    try {
      // Convert to Dgraph nested array format
      const nestedArray = `[[${testCoords.map(coord => `[${coord[1]}, ${coord[0]}]`).join(', ')}]]`;
      console.log('📍 Dgraph within() nested array format:', nestedArray);
      console.log('📍 Note: Dgraph expects nested array format: [[[lng, lat], [lng, lat], ...]]');
      
      // Validate ranges
      const validLng = testCoords.every(coord => coord[1] >= -180 && coord[1] <= 180);
      const validLat = testCoords.every(coord => coord[0] >= -90 && coord[0] <= 90);
      
      console.log('📍 Longitude range valid:', validLng);
      console.log('📍 Latitude range valid:', validLat);
      
      if (!validLng || !validLat) {
        console.error('❌ Invalid coordinate ranges detected!');
        console.error('   Longitude must be -180 to 180');
        console.error('   Latitude must be -90 to 90');
      }
      
      // Show example query
      console.log('📍 Example Dgraph query:');
      console.log(`   @filter(within(location, ${nestedArray}))`);
      
      return nestedArray;
    } catch (error) {
      console.error('❌ Error testing DQL format:', error);
      return null;
    }
  }, []);

  // Test geospatial query functionality
  const testGeospatialQuery = useCallback(async () => {
    if (!dgraphService || !connected) {
      setError('Not connected to database');
      return;
    }

    setIsQuerying(true);
    setError(null);

    try {
      console.log('🧪 Testing geospatial query functionality...');
      
      // First, discover available predicates
      const predicates = await discoverGeospatialPredicates();
      console.log('🔍 Discovered predicates:', predicates);
      
      if (predicates.length === 0) {
        // Try a simple query to see what's available
        console.log('🔍 No geospatial predicates found, trying simple query...');
        
        const simpleQuery = `{
          q(func: has(dgraph.type), first: 10) {
            uid
            dgraph.type
            expand(_all_) {
              uid
              dgraph.type
            }
          }
        }`;
        
        const result = await dgraphService.query(simpleQuery);
        console.log('📊 Simple query result:', result);
        
        if (result.data && result.data.q) {
          // Look for any potential geospatial data
          const potentialGeoData: any[] = [];
          
          result.data.q.forEach((node: any) => {
            Object.entries(node).forEach(([key, value]) => {
              if (key !== 'uid' && key !== 'dgraph.type' && value) {
                if (typeof value === 'string' && (
                  value.includes('POINT') ||
                  value.includes('POLYGON') ||
                  value.includes('LINESTRING')
                )) {
                  potentialGeoData.push({ node, field: key, value });
                } else if (typeof value === 'object' && value !== null && (
                  (value as any).lat || (value as any).lng || (value as any).latitude || (value as any).longitude
                )) {
                  potentialGeoData.push({ node, field: key, value });
                }
              }
            });
          });
          
          if (potentialGeoData.length > 0) {
            console.log('🎯 Found potential geospatial data:', potentialGeoData);
            setError(`Found ${potentialGeoData.length} potential geospatial fields. Try drawing a polygon to query them.`);
          } else {
            setError('No geospatial data found. The database may not contain location information.');
          }
        }
      } else {
        // Test a simple geospatial query with the first predicate
        const testPredicate = predicates[0];
        console.log(`🧪 Testing query with predicate: ${testPredicate}`);
        
        // Create a simple bounding box query
        const testQuery = `{
          q(func: has(${testPredicate}), first: 5) {
            uid
            dgraph.type
            ${testPredicate}
            expand(_all_)
          }
        }`;
        
        const result = await dgraphService.query(testQuery);
        console.log('📊 Test query result:', result);
        
        if (result.data && result.data.q && result.data.q.length > 0) {
          setError(`✅ Test successful! Found ${result.data.q.length} nodes with ${testPredicate}. Draw a polygon to execute spatial queries.`);
        } else {
          setError(`⚠️ Test query returned no results for ${testPredicate}`);
        }
      }
    } catch (err) {
      console.error('❌ Test query failed:', err);
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsQuerying(false);
    }
  }, [dgraphService, connected, discoverGeospatialPredicates]);

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
              <div 
                ref={mapContainerRef} 
                style={{ width: '100%', height: '100%' }}
              />

              {/* Debug Info */}
              <Box
                position="absolute"
                top="10px"
                left="10px"
                bg="red.100"
                p={2}
                borderRadius="md"
                fontSize="xs"
                zIndex={9998}
              >
                Debug: selectedFeature={selectedFeature ? 'YES' : 'NO'}, popupPosition={popupPosition ? 'YES' : 'NO'}
                {selectedFeature && (
                  <Box mt={1} p={1} bg="green.100" borderRadius="sm">
                    Feature UID: {selectedFeature.properties?.uid}
                  </Box>
                )}
              </Box>

              {/* Feature Popup */}
              {(() => {
                console.log('🔄 Render check - selectedFeature:', selectedFeature ? 'YES' : 'NO');
                console.log('🔄 Render check - popupPosition:', popupPosition ? 'YES' : 'NO');
                console.log('🔄 Render check - Should show popup:', selectedFeature && popupPosition ? 'YES' : 'NO');
                return null;
              })()}
              {selectedFeature && popupPosition && (
                <Box
                  position="absolute"
                  top="20px"
                  right="20px"
                  bg="white"
                  p={4}
                  borderRadius="md"
                  shadow="xl"
                  border="1px"
                  borderColor="gray.200"
                  maxW="400px"
                  maxH="300px"
                  overflowY="auto"
                  zIndex={9999}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box position="absolute" top="-10px" left="-10px" bg="red" color="white" p={1} borderRadius="full" fontSize="xs">
                    POPUP ACTIVE
                  </Box>
                  <VStack gap={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Heading size="sm">Node Details</Heading>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={closeFeaturePopup}
                        p={1}
                        minW="auto"
                      >
                        ×
                      </Button>
                    </HStack>
                    
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Basic Information
                      </Text>
                      <VStack gap={2} align="start">
                        <HStack gap={2}>
                          <Text fontSize="xs" color="gray.600" minW="60px">UID:</Text>
                          <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                            {selectedFeature.properties?.uid}
                          </Text>
                        </HStack>
                        <HStack gap={2}>
                          <Text fontSize="xs" color="gray.600" minW="60px">Type:</Text>
                          <Badge size="sm" variant="outline" colorScheme="blue">
                            {selectedFeature.properties?.type}
                          </Badge>
                        </HStack>
                        {selectedFeature.properties?.geometryPredicate && (
                          <HStack gap={2}>
                            <Text fontSize="xs" color="gray.600" minW="60px">Geometry:</Text>
                            <Text fontSize="xs" color="gray.700">
                              {selectedFeature.properties.geometryPredicate}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>

                    {selectedFeature.properties?.allLocationFields && Object.keys(selectedFeature.properties.allLocationFields).length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Location Fields
                        </Text>
                        <VStack gap={1} align="start">
                          {Object.entries(selectedFeature.properties.allLocationFields).slice(0, 5).map(([key, value]) => (
                            <HStack key={key} gap={2} align="start">
                              <Text fontSize="xs" fontWeight="medium" color="gray.700" minW="80px">
                                {key}:
                              </Text>
                              <Text fontSize="xs" color="gray.600" wordBreak="break-all">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).slice(0, 80) + (JSON.stringify(value).length > 80 ? '...' : '')
                                  : String(value).slice(0, 80) + (String(value).length > 80 ? '...' : '')
                                }
                              </Text>
                            </HStack>
                          ))}
                          {Object.keys(selectedFeature.properties.allLocationFields).length > 5 && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              +{Object.keys(selectedFeature.properties.allLocationFields).length - 5} more location fields
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}

                    {selectedFeature.properties && Object.keys(selectedFeature.properties).filter(key => 
                      !['uid', 'type', 'geometryPredicate', 'allLocationFields'].includes(key)
                    ).length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Properties
                        </Text>
                        <VStack gap={1} align="start">
                          {Object.entries(selectedFeature.properties)
                            .filter(([key]) => !['uid', 'type', 'geometryPredicate', 'allLocationFields'].includes(key))
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <HStack key={key} gap={2} align="start">
                                <Text fontSize="xs" fontWeight="medium" color="gray.700" minW="80px">
                                  {key}:
                                </Text>
                                <Text fontSize="xs" color="gray.600" wordBreak="break-all">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value).slice(0, 80) + (JSON.stringify(value).length > 80 ? '...' : '')
                                    : String(value).slice(0, 80) + (String(value).length > 80 ? '...' : '')
                                  }
                                </Text>
                              </HStack>
                            ))}
                          {Object.keys(selectedFeature.properties).filter(key => 
                            !['uid', 'type', 'geometryPredicate', 'allLocationFields'].includes(key)
                          ).length > 5 && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              +{Object.keys(selectedFeature.properties).filter(key => 
                                !['uid', 'type', 'geometryPredicate', 'allLocationFields'].includes(key)
                              ).length - 5} more properties
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}

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
                  
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testDQLPolygonFormat}
                    >
                      Test DQL Format
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testGeospatialQuery}
                      loading={isQuerying}
                    >
                      {isQuerying ? 'Testing...' : 'Test Query'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const testFeature = {
                          type: 'Feature',
                          geometry: { type: 'Point', coordinates: [0, 0] },
                          properties: {
                            uid: '0x12345',
                            type: 'Test',
                            geometryPredicate: 'location',
                            allLocationFields: { lat: 42.0, lng: -72.0 },
                            testProp: 'Test Value'
                          }
                        } as GeoJSON.Feature;
                        setSelectedFeature(testFeature);
                        setPopupPosition({ lng: -72.0, lat: 42.0 });
                      }}
                    >
                      Test Popup
                    </Button>
                    
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
                  </HStack>
                </VStack>
              </Box>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* Dashboard Section */}
        <Card.Root variant="elevated" w="400px" h="500px">
          <Card.Header>
            <Heading size="md">Query Dashboard</Heading>
          </Card.Header>
          <Card.Body p={0} h="calc(500px - 60px)">
            <Box
              h="full"
              overflowY="auto"
              overflowX="hidden"
              p={4}
              css={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#a8a8a8',
                },
              }}
            >
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
            </Box>
          </Card.Body>
        </Card.Root>
      </HStack>

      {/* Query Results Table */}
      {queryResults.length > 0 && (
        <Card.Root variant="elevated">
          <Card.Header>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading size="md">Query Results ({queryResults.length})</Heading>
                <HStack gap={2}>
                  <Text fontSize="sm" color="gray.600">
                    Showing {filteredAndSortedResults.length} of {queryResults.length} results
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearResults}
                  >
                    Clear Results
                  </Button>
                </HStack>
              </HStack>
              
              {/* Search and Sort Controls */}
              <HStack gap={4} align="center">
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Search Results
                  </Text>
                  <input
                    type="text"
                    placeholder="Search by UID, type, or property values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Sort By
                  </Text>
                  <HStack gap={2}>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'uid' | 'type' | 'properties')}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="uid">UID</option>
                      <option value="type">Type</option>
                      <option value="properties">Property Count</option>
                    </select>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            </VStack>
          </Card.Header>
          <Card.Body p={0}>
            <Box
              maxH="400px"
              overflowY="auto"
              overflowX="auto"
              borderTop="1px"
              borderColor="gray.200"
            >
              <Box as="table" w="full">
                <Box as="thead" position="sticky" top={0} bg="gray.50" zIndex={1}>
                  <Box as="tr">
                    <Box
                      as="th"
                      px={4}
                      py={3}
                      textAlign="left"
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="1px"
                      borderColor="gray.200"
                      minW="120px"
                    >
                      UID
                    </Box>
                    <Box
                      as="th"
                      px={4}
                      py={3}
                      textAlign="left"
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="1px"
                      borderColor="gray.200"
                      minW="100px"
                    >
                      Type
                    </Box>
                    <Box
                      as="th"
                      px={4}
                      py={3}
                      textAlign="left"
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="1px"
                      borderColor="gray.200"
                      minW="200px"
                    >
                      Properties
                    </Box>
                    <Box
                      as="th"
                      px={4}
                      py={3}
                      textAlign="left"
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="1px"
                      borderColor="gray.200"
                      minW="120px"
                    >
                      Geometry
                    </Box>
                    <Box
                      as="th"
                      px={4}
                      py={3}
                      textAlign="left"
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="1px"
                      borderColor="gray.200"
                      minW="150px"
                    >
                      Location Fields
                    </Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {filteredAndSortedResults.map((result, index) => (
                    <Box
                      as="tr"
                      key={result.uid}
                      bg={index % 2 === 0 ? 'white' : 'gray.50'}
                      _hover={{ bg: 'blue.50' }}
                      transition="background-color 0.2s"
                    >
                      <Box
                        as="td"
                        px={4}
                        py={3}
                        fontSize="sm"
                        fontFamily="mono"
                        color="gray.900"
                        borderBottom="1px"
                        borderColor="gray.200"
                        verticalAlign="top"
                      >
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          UID
                        </Text>
                        <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">
                          {result.uid}
                        </Text>
                      </Box>
                      <Box
                        as="td"
                        px={4}
                        py={3}
                        fontSize="sm"
                        color="gray.900"
                        borderBottom="1px"
                        borderColor="gray.200"
                        verticalAlign="top"
                      >
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Type
                        </Text>
                        <Badge variant="outline" colorScheme="blue">
                          {result.type}
                        </Badge>
                      </Box>
                      <Box
                        as="td"
                        px={4}
                        py={3}
                        fontSize="sm"
                        color="gray.900"
                        borderBottom="1px"
                        borderColor="gray.200"
                        verticalAlign="top"
                      >
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Properties
                        </Text>
                        <VStack gap={1} align="start">
                          {Object.entries(result.properties).slice(0, 5).map(([key, value]) => (
                            <HStack key={key} gap={2} align="start">
                              <Text fontSize="xs" fontWeight="medium" color="gray.700" minW="80px">
                                {key}:
                              </Text>
                              <Text fontSize="xs" color="gray.600" wordBreak="break-all">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                                  : String(value).slice(0, 100) + (String(value).length > 100 ? '...' : '')
                                }
                              </Text>
                            </HStack>
                          ))}
                          {Object.keys(result.properties).length > 5 && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              +{Object.keys(result.properties).length - 5} more properties
                            </Text>
                          )}
                        </VStack>
                      </Box>
                      <Box
                        as="td"
                        px={4}
                        py={3}
                        fontSize="sm"
                        color="gray.900"
                        borderBottom="1px"
                        borderColor="gray.200"
                        verticalAlign="top"
                      >
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Geometry
                        </Text>
                        <VStack gap={1} align="start">
                          <Text fontSize="xs" fontWeight="medium" color="gray.700">
                            Type: {result.geometry?.type || 'Unknown'}
                          </Text>
                          {result.geometryPredicate && (
                            <Text fontSize="xs" color="gray.600">
                              Predicate: {result.geometryPredicate}
                            </Text>
                          )}
                          {result.geometry?.coordinates && (
                            <Text fontSize="xs" color="gray.600" fontFamily="mono">
                              Coords: {JSON.stringify(result.geometry.coordinates).slice(0, 50)}...
                            </Text>
                          )}
                        </VStack>
                      </Box>
                      <Box
                        as="td"
                        px={4}
                        py={3}
                        fontSize="sm"
                        color="gray.900"
                        borderBottom="1px"
                        borderColor="gray.200"
                        verticalAlign="top"
                      >
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Location Fields
                        </Text>
                        <VStack gap={1} align="start">
                          {Object.keys(result.allLocationFields || {}).length > 0 ? (
                            Object.entries(result.allLocationFields).slice(0, 3).map(([key, value]) => (
                              <HStack key={key} gap={2} align="start">
                                <Text fontSize="xs" fontWeight="medium" color="gray.700" minW="60px">
                                  {key}:
                                </Text>
                                <Text fontSize="xs" color="gray.600" wordBreak="break-all">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value).slice(0, 80) + (JSON.stringify(value).length > 80 ? '...' : '')
                                    : String(value).slice(0, 80) + (String(value).length > 80 ? '...' : '')
                                  }
                                </Text>
                              </HStack>
                            ))
                          ) : (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              No location fields
                            </Text>
                          )}
                          {Object.keys(result.allLocationFields || {}).length > 3 && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              +{Object.keys(result.allLocationFields).length - 3} more location fields
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default GeospatialTab;
