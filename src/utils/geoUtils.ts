// Utility functions for handling geo-spatial data

// Interface for geo-node data
export interface GeoNode {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  raw: any;
  type?: string;
}

// Interface for edge data
export interface GeoEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

/**
 * Detects if a query result contains geographic coordinates
 * @param data The query result data
 * @returns True if geographic data is detected
 */
export function hasGeoData(data: any): boolean {
  if (!data) return false;
  
  // Check if the data contains location information
  let hasLocation = false;
  
  // Common geo field patterns
  const geoFields = [
    { lat: ['latitude', 'lat'], lng: ['longitude', 'lng', 'lon'] },
    { coordinates: ['location', 'geo', 'coordinates', 'position', 'point', 'coords'] }
  ];
  
  // Function to check a node for location data
  const checkNodeForLocation = (node: any): boolean => {
    if (!node || typeof node !== 'object') return false;
    
    // Check for direct lat/lng properties
    const latFields = geoFields[0]?.lat || [];
    const lngFields = geoFields[0]?.lng || [];
    
    for (const latField of latFields) {
      for (const lngField of lngFields) {
        if (
          latField in node && 
          lngField in node && 
          isValidCoordinate(node[latField], node[lngField])
        ) {
          return true;
        }
      }
    }
    
    // Check for coordinate object properties
    const coordFields = geoFields[1]?.coordinates || [];
    
    for (const coordField of coordFields) {
      if (coordField in node && node[coordField]) {
        const coords = node[coordField];
        
        // Check if coordinates is an object with lat/lng
        if (typeof coords === 'object' && !Array.isArray(coords)) {
          for (const latField of latFields) {
            for (const lngField of lngFields) {
              if (
                latField in coords && 
                lngField in coords && 
                isValidCoordinate(coords[latField], coords[lngField])
              ) {
                return true;
              }
            }
          }
        }
        
        // Check if coordinates is an array [lng, lat] (GeoJSON format)
        if (Array.isArray(coords) && 
            coords.length === 2 && 
            isValidCoordinate(coords[1], coords[0])) {
          return true;
        }
      }
    }
    
    // Check for Dgraph specific geo data (location or coordinates field)
    if ('location' in node && node.location && typeof node.location === 'object') {
      if ('coordinates' in node.location && Array.isArray(node.location.coordinates)) {
        // GeoJSON format: [longitude, latitude]
        const coords = node.location.coordinates;
        if (coords.length === 2 && isValidCoordinate(coords[1], coords[0])) {
          return true;
        }
      }
    }
    
    // Check for Dgraph Geo.location format
    if ('Geo.location' in node && node['Geo.location'] && typeof node['Geo.location'] === 'object') {
      if ('coordinates' in node['Geo.location'] && Array.isArray(node['Geo.location'].coordinates)) {
        // GeoJSON format: [longitude, latitude]
        const coords = node['Geo.location'].coordinates;
        if (coords.length === 2 && isValidCoordinate(coords[1], coords[0])) {
          return true;
        }
      }
    }
    
    // Check nested objects recursively
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          for (const item of node[key]) {
            if (item && typeof item === 'object' && checkNodeForLocation(item)) {
              return true;
            }
          }
        } else if (checkNodeForLocation(node[key])) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Deep scan for geo data at any level of nesting
  const deepScanForGeoData = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;

    // Check if this node has geo data
    if (checkNodeForLocation(obj)) return true;
    
    // If it's an array, check each element
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (deepScanForGeoData(item)) return true;
      }
      return false;
    }

    // If it's an object, check each property
    // Special handling for Article.geo and similar patterns
    for (const key in obj) {
      // Skip special properties like dgraph.type
      if (key === 'dgraph.type' || key === 'uid') continue;

      // Handle nested arrays (like Article.geo)
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if (deepScanForGeoData(item)) return true;
        }
      }
      // Handle nested objects
      else if (obj[key] && typeof obj[key] === 'object') {
        if (deepScanForGeoData(obj[key])) return true;
      }
    }
    
    return false;
  };

  // Extract data from Dgraph response format
  if (data.data) {
    const responseData = data.data;
    // Scan the entire response data structure
    hasLocation = deepScanForGeoData(responseData);
  }
  
  return hasLocation;
}

/**
 * Validates if coordinates are within valid ranges
 */
function isValidCoordinate(lat: any, lng: any): boolean {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return (
    !isNaN(latitude) && 
    !isNaN(longitude) && 
    latitude >= -90 && 
    latitude <= 90 && 
    longitude >= -180 && 
    longitude <= 180
  );
}

/**
 * Extracts geo nodes and edges from query results
 * @param data The query result data
 * @param getColorForType Function to get color for a node type
 * @returns Object with nodes and edges arrays
 */
export function extractGeoNodesAndEdges(
  data: any, 
  getColorForType: (type: string | undefined) => string
): { nodes: GeoNode[], edges: GeoEdge[] } {
  const nodes: GeoNode[] = [];
  const edges: GeoEdge[] = [];
  const nodeMap = new Map<string, boolean>();
  
  if (!data || !data.data) return { nodes, edges };
  
  // Extract data from Dgraph response format
  const responseData = data.data;
  const queryKey = Object.keys(responseData)[0];
  
  if (!queryKey) return { nodes, edges };
  
  const queryData = responseData[queryKey];
  
  // Function to extract coordinates from a node
  const extractNodeCoordinates = (
    node: any
  ): { lat: number; lng: number } | null => {
    if (!node || typeof node !== 'object') return null;
    
    // Common geo field patterns
    const latFields = ['latitude', 'lat'];
    const lngFields = ['longitude', 'lng', 'lon'];
    const coordFields = ['location', 'geo', 'coordinates', 'position', 'point', 'coords'];
    
    // Check for direct lat/lng properties
    for (const latField of latFields) {
      for (const lngField of lngFields) {
        if (
          latField in node && 
          lngField in node && 
          isValidCoordinate(node[latField], node[lngField])
        ) {
          return {
            lat: parseFloat(node[latField]),
            lng: parseFloat(node[lngField])
          };
        }
      }
    }
    
    // Check for coordinate object properties
    for (const coordField of coordFields) {
      if (coordField in node && node[coordField]) {
        const coords = node[coordField];
        
        // Check if coordinates is an object with lat/lng
        if (typeof coords === 'object' && !Array.isArray(coords)) {
          for (const latField of latFields) {
            for (const lngField of lngFields) {
              if (
                latField in coords && 
                lngField in coords && 
                isValidCoordinate(coords[latField], coords[lngField])
              ) {
                return {
                  lat: parseFloat(coords[latField]),
                  lng: parseFloat(coords[lngField])
                };
              }
            }
          }
        }
        
        // Check if coordinates is an array [lng, lat] (GeoJSON format)
        if (Array.isArray(coords) && 
            coords.length === 2 && 
            isValidCoordinate(coords[1], coords[0])) {
          return {
            lat: parseFloat(coords[1]),
            lng: parseFloat(coords[0])
          };
        }
      }
    }
    
    // Check for Dgraph specific geo data (location or coordinates field)
    if ('location' in node && node.location && typeof node.location === 'object') {
      if ('coordinates' in node.location && Array.isArray(node.location.coordinates)) {
        // GeoJSON format: [longitude, latitude]
        const coords = node.location.coordinates;
        if (coords.length === 2 && isValidCoordinate(coords[1], coords[0])) {
          return {
            lat: parseFloat(coords[1]),
            lng: parseFloat(coords[0])
          };
        }
      }
    }
    
    // Check for Dgraph Geo.location format (both direct and nested)
    if ('Geo.location' in node && node['Geo.location'] && typeof node['Geo.location'] === 'object') {
      if ('coordinates' in node['Geo.location'] && Array.isArray(node['Geo.location'].coordinates)) {
        // GeoJSON format: [longitude, latitude]
        const coords = node['Geo.location'].coordinates;
        if (coords.length === 2 && isValidCoordinate(coords[1], coords[0])) {
          return {
            lat: parseFloat(coords[1]),
            lng: parseFloat(coords[0])
          };
        }
      }
    }
    
    // Also check for Article.geo or other pattern where geo is nested
    for (const key in node) {
      if (key.endsWith('.geo') && node[key] && typeof node[key] === 'object') {
        // First check if it's a direct reference to a Geo node with location
        if ('Geo.location' in node[key] && node[key]['Geo.location'] &&
            typeof node[key]['Geo.location'] === 'object') {
          if ('coordinates' in node[key]['Geo.location'] &&
              Array.isArray(node[key]['Geo.location'].coordinates)) {
            const coords = node[key]['Geo.location'].coordinates;
            if (coords.length === 2 && isValidCoordinate(coords[1], coords[0])) {
              return {
                lat: parseFloat(coords[1]),
                lng: parseFloat(coords[0])
              };
            }
          }
        }
        
        // Also check for direct location property
        if ('location' in node[key] && node[key].location &&
            typeof node[key].location === 'object') {
          if ('coordinates' in node[key].location &&
              Array.isArray(node[key].location.coordinates)) {
            const coords = node[key].location.coordinates;
            if (coords.length === 2 && isValidCoordinate(coords[1], coords[0])) {
              return {
                lat: parseFloat(coords[1]),
                lng: parseFloat(coords[0])
              };
            }
          }
        }
      }
    }
    
    return null;
  };
  
  // Function to add a node
  const addGeoNode = (node: any) => {
    if (!node || typeof node !== 'object' || !('uid' in node)) return;
    
    const nodeId = node.uid;
    if (nodeMap.has(nodeId)) return;
    
    // Extract coordinates
    const coordinates = extractNodeCoordinates(node);
    if (!coordinates) return;
    
    // Get node type (using 'dgraph.type' predicate)
    const nodeType = node['dgraph.type'] || node.type;
    const nodeTypeStr = Array.isArray(nodeType) ? nodeType[0] : nodeType;
    
    // Create geo node
    nodes.push({
      id: nodeId,
      label: node.name || node.title || `Node ${nodeId.substring(0, 8)}`,
      lat: coordinates.lat,
      lng: coordinates.lng,
      color: getColorForType(nodeTypeStr),
      raw: node,
      type: nodeTypeStr
    });
    
    nodeMap.set(nodeId, true);
  };
  
  // Function to add edges recursively
  const addGeoEdges = (node: any) => {
    if (!node || typeof node !== 'object' || !('uid' in node)) return;
    
    const nodeId = node.uid;
    if (!nodeMap.has(nodeId)) return;
    
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'uid' || value === null) return;
      
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && typeof item === 'object' && 'uid' in item) {
            const targetId = item.uid;
            if (nodeMap.has(targetId) && nodeId !== targetId) {
              edges.push({
                id: `${nodeId}-${targetId}-${String(key)}`,
                source: nodeId,
                target: targetId,
                label: String(key)
              });
            }
            addGeoEdges(item);
          }
        });
      } else if (typeof value === 'object' && value !== null && 'uid' in value) {
        const targetId = String(value.uid);
        if (nodeMap.has(targetId) && nodeId !== targetId) {
          edges.push({
            id: `${nodeId}-${targetId}-${String(key)}`,
            source: nodeId,
            target: targetId,
            label: String(key)
          });
        }
        addGeoEdges(value);
      }
    });
  };
  
  // Deep scan function to find and process all geo nodes at any level
  const deepScanAndProcessGeoNodes = (obj: any, path: string = ''): void => {
    if (!obj || typeof obj !== 'object') return;

    // Process this node if it has geo data
    addGeoNode(obj);
    
    // If it's an array, scan each element
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (item && typeof item === 'object') {
          deepScanAndProcessGeoNodes(item, `${path}[${index}]`);
        }
      });
      return;
    }

    // For objects, scan each property
    for (const key in obj) {
      // Skip special properties
      if (key === 'dgraph.type' || key === 'uid') continue;
      
      const value = obj[key];
      
      // Handle arrays (like Article.geo)
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === 'object') {
            // Process each item in the array
            deepScanAndProcessGeoNodes(item, `${path}.${key}[${index}]`);
          }
        });
      }
      // Handle nested objects
      else if (value && typeof value === 'object') {
        deepScanAndProcessGeoNodes(value, `${path}.${key}`);
      }
    }
  };
  
  // Second pass to create edges
  const deepScanForEdges = (obj: any): void => {
    if (!obj || typeof obj !== 'object') return;

    // Process edges for this node
    addGeoEdges(obj);
    
    // If it's an array, process each element
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        if (item && typeof item === 'object') {
          deepScanForEdges(item);
        }
      });
      return;
    }

    // For objects, process each property
    for (const key in obj) {
      // Skip special properties
      if (key === 'dgraph.type' || key === 'uid') continue;
      
      const value = obj[key];
      
      // Handle arrays
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object') {
            deepScanForEdges(item);
          }
        });
      }
      // Handle nested objects
      else if (value && typeof value === 'object') {
        deepScanForEdges(value);
      }
    }
  };

  // Process the data
  if (responseData && typeof responseData === 'object') {
    // First pass: find and create all geo nodes at any level
    deepScanAndProcessGeoNodes(responseData);
    
    // Second pass: create edges between nodes with geo data
    deepScanForEdges(responseData);
  }
  
  return { nodes, edges };
}

/**
 * Calculates a geographic center point from a set of coordinates
 */
export function calculateGeoCenter(nodes: GeoNode[]): [number, number] {
  if (nodes.length === 0) {
    // Default to New York City if no nodes
    return [40.7128, -74.0060];
  }
  
  const latSum = nodes.reduce((sum, node) => sum + node.lat, 0);
  const lngSum = nodes.reduce((sum, node) => sum + node.lng, 0);
  
  return [latSum / nodes.length, lngSum / nodes.length];
}

/**
 * Creates a geographic-based layout for a graphology graph based on lat/lng coordinates
 * @param graph The graphology graph
 * @param geoNodes Array of nodes with geographic coordinates
 */
export function applyGeoLayout(graph: any, geoNodes: GeoNode[]): void {
  // Map node IDs to coordinates
  const coordMap = new Map<string, { x: number, y: number }>();
  
  // First, extract the min/max coordinates to create a normalized space
  let minLat = Number.MAX_VALUE;
  let maxLat = -Number.MAX_VALUE;
  let minLng = Number.MAX_VALUE;
  let maxLng = -Number.MAX_VALUE;
  
  geoNodes.forEach(node => {
    minLat = Math.min(minLat, node.lat);
    maxLat = Math.max(maxLat, node.lat);
    minLng = Math.min(minLng, node.lng);
    maxLng = Math.max(maxLng, node.lng);
  });
  
  // Calculate the range for normalization
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  
  // Create normalized coordinates in the [0,1] range
  geoNodes.forEach(node => {
    // Normalized coordinates in the [0,1] range, with y-axis flipped for graph layout
    const x = (node.lng - minLng) / lngRange;
    const y = 1 - (node.lat - minLat) / latRange; // Flip Y so north is up
    
    coordMap.set(node.id, { x, y });
  });
  
  // Apply coordinates to graph nodes
  graph.forEachNode((nodeId: string) => {
    const coords = coordMap.get(nodeId);
    if (coords) {
      graph.setNodeAttribute(nodeId, 'x', coords.x);
      graph.setNodeAttribute(nodeId, 'y', coords.y);
      graph.setNodeAttribute(nodeId, 'geoPositioned', true);
    }
  });
}
