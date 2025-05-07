'use client';

import React, { useState, useEffect } from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import Graphology from 'graphology';
import { random } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import dynamic from 'next/dynamic';
import FullscreenToggle from './FullscreenToggle';
import { hasGeoData, extractGeoNodesAndEdges } from '@/utils/geoUtils';

// Dynamically import SigmaGraph to avoid SSR issues with WebGL
const SigmaGraph = dynamic(() => import('./SigmaGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full bg-gray-100">
      <p className="text-gray-500">Loading graph visualization...</p>
    </div>
  )
});

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full bg-gray-100">
      <p className="text-gray-500">Loading map view...</p>
    </div>
  )
});

// Styles are now included in globals.css

interface GraphVisualizationProps {
  data: any;
}

export default function GraphVisualization({ data }: GraphVisualizationProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'json' | 'map'>('graph');
  const [graph, setGraph] = useState<Graphology | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typeColorMap, setTypeColorMap] = useState<Map<string, {color: string, count: number}>>(new Map());
  const [geoNodes, setGeoNodes] = useState<any[]>([]);
  const [geoEdges, setGeoEdges] = useState<any[]>([]);
  const [hasGeo, setHasGeo] = useState(false);

  // No longer needed: options for react-graph-vis

  // Process data for graph visualization
  useEffect(() => {
    if (data) {
      setIsProcessing(true);
      processDataForSigmaGraph(data);

      // Check if data contains geo information
      const geoDataPresent = hasGeoData(data);
      setHasGeo(geoDataPresent);

      // If geo data is present, process it for the map view
      if (geoDataPresent) {
        try {
          const getColorForType = (type: string | undefined): string => {
            if (!type) return '#9E9E9E';
            return typeColorMap.get(type)?.color || getRandomColor();
          };

          const processedGeoData = extractGeoNodesAndEdges(data, getColorForType);
          setGeoNodes(processedGeoData.nodes);
          setGeoEdges(processedGeoData.edges);
        } catch (error) {
          console.error('Error processing geo data:', error);
          setGeoNodes([]);
          setGeoEdges([]);
        }
      }
    }
  }, [data]);



  // Convert Dgraph response to graphology graph for sigma.js
  const processDataForSigmaGraph = (queryResult: any) => {
    try {
      // Extract the actual data from the Dgraph response
      const responseData = queryResult.data;
      if (!responseData) {
        setGraph(null);
        setIsProcessing(false);
        return;
      }

      // Get the first query result key
      const queryKey = Object.keys(responseData)[0];
      if (!queryKey) {
        setGraph(null);
        setIsProcessing(false);
        return;
      }

      const queryData = responseData[queryKey];

      // Build a graphology graph
      const graph = new Graphology();
      const nodeMap = new Map();

      // Map to track node types, counts, and colors
      const newTypeColorMap = new Map<string, {color: string, count: number}>();

      // Predefined vibrant colors for node types (will be assigned in sequence)
      const colorPalette = [
        '#4285F4',  // Google Blue
        '#EA4335',  // Google Red
        '#FBBC05',  // Google Yellow
        '#34A853',  // Google Green
        '#673AB7',  // Deep Purple
        '#FF9800',  // Orange
        '#009688',  // Teal
        '#E91E63',  // Pink
        '#9C27B0',  // Purple
        '#CDDC39',  // Lime
        '#00BCD4',  // Cyan
        '#8BC34A',  // Light Green
        '#FFC107',  // Amber
        '#3F51B5',  // Indigo
        '#795548',  // Brown
        '#607D8B',  // Blue Grey
        '#FF5722',  // Deep Orange
        '#2196F3'   // Light Blue
      ];

      const defaultColor = '#9E9E9E'; // Grey (default)
      const typeColorAssignment = new Map<string, string>();
      let colorIndex = 0;

      // Helper to get color for a node type (assigns colors dynamically)
      const getColorForType = (type: string | undefined): string => {
        if (!type) return defaultColor;

        // If we haven't seen this type before, assign the next color in palette
        if (!typeColorAssignment.has(type)) {
          // Use the next color in the palette or wrap around if we run ou
          const color = colorPalette[colorIndex % colorPalette.length];
          typeColorAssignment.set(type, color);
          colorIndex++;
        }

        return typeColorAssignment.get(type) || defaultColor;
      };

      // First pass: add all nodes recursively
      const addNodes = (node: any) => {
        const nodeType = node['dgraph.type'] || node.type;
        console.log('Processing node:', node?.uid, 'type:', nodeType, 'properties:', Object.keys(node));
        // Special logging for Geo nodes
        if (nodeType && Array.isArray(nodeType) && nodeType.includes('Geo')) {
          console.log('Found Geo node:', node);
        }
        if (!node || typeof node !== 'object') return;
        if (!('uid' in node)) return;
        const nodeId = node.uid;
        if (!nodeMap.has(nodeId)) {
          // Get the node type (using 'dgraph.type' predicate)
          const nodeType = node['dgraph.type'] || node.type;
          let nodeTypeStr = Array.isArray(nodeType) ? nodeType[0] : nodeType;
          // Debug Geo nodes specifically
          if (nodeTypeStr === 'Geo') {
            console.log('Adding Geo node to graph:', node.uid, node);
          }

          // Track count of this type
          if (nodeTypeStr) {
            if (!newTypeColorMap.has(nodeTypeStr)) {
              newTypeColorMap.set(nodeTypeStr, {
                color: getColorForType(nodeTypeStr),
                count: 1
              });
            } else {
              const typeInfo = newTypeColorMap.get(nodeTypeStr);
              if (typeInfo) {
                newTypeColorMap.set(nodeTypeStr, {
                  color: typeInfo.color,
                  count: typeInfo.count + 1
                });
              }
            }
          }
          graph.addNode(nodeId, {
            label: node.name || node.title || `Node ${nodeId.substring(0, 8)}`,
            color: nodeTypeStr ? getColorForType(nodeTypeStr) : defaultColor,
            raw: node,
            type: nodeTypeStr
          });
          nodeMap.set(nodeId, true);
        }
        Object.entries(node).forEach(([key, value]) => {
          if (key === 'uid' || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object' && 'uid' in item) {
                addNodes(item);
              }
            });
          } else if (typeof value === 'object' && 'uid' in value) {
            addNodes(value);
          }
        });
      };
      // Second pass: add all edges recursively
      const addEdges = (node: any) => {
        // Check if this is a parent node with Geo connections
        if (node && typeof node === 'object' && 'Article.geo' in node) {
          console.log('Found node with Geo connections:', node.uid, node['Article.geo']);
        }
        if (!node || typeof node !== 'object') return;
        if (!('uid' in node)) return;
        const nodeId = node.uid;
        Object.entries(node).forEach(([key, value]) => {
          if (key === 'uid' || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object' && 'uid' in item) {
                const targetId = item.uid;
                if (graph.hasNode(nodeId) && graph.hasNode(targetId) && nodeId !== targetId) {
                  const edgeId = `${nodeId}-${targetId}-${key}`;
                  if (!graph.hasEdge(edgeId)) {
                    graph.addEdgeWithKey(edgeId, nodeId, targetId, { label: key });
                  }
                }
                addEdges(item);
              }
            });
          } else if (typeof value === 'object' && 'uid' in value) {
            const targetId = value.uid;
            if (graph.hasNode(nodeId) && graph.hasNode(targetId) && nodeId !== targetId) {
              const edgeId = `${nodeId}-${targetId}-${key}`;
              if (!graph.hasEdge(edgeId)) {
                graph.addEdgeWithKey(edgeId, nodeId, targetId, { label: key });
              }
            }
            addEdges(value);
          }
        });
      };

      if (Array.isArray(queryData)) {
        queryData.forEach(node => addNodes(node));
        queryData.forEach(node => addEdges(node));
      } else if (queryData && typeof queryData === 'object') {
        addNodes(queryData);
        addEdges(queryData);
      }
      // Run an initial layout to position nodes
      forceAtlas2.assign(graph, { iterations: 50, settings: {
        gravity: 0.05,
        scalingRatio: 4,
        strongGravityMode: false,
        slowDown: 5,
        linLogMode: false,
        outboundAttractionDistribution: false,
        adjustSizes: true
      }});

      // We'll use continuous simulation in SigmaGraph componen
      // Ensure all nodes have numeric x and y coordinates
      graph.forEachNode((node, attrs) => {
        if (typeof attrs.x !== 'number' || typeof attrs.y !== 'number') {
          graph.mergeNodeAttributes(node, {
            x: Math.random(),
            y: Math.random()
          });
        }
      });
    // Debug info for node types
    console.log('Types detected:', Array.from(newTypeColorMap.keys()));
    console.log('Type counts:', Array.from(newTypeColorMap.entries()).map(([type, info]) => `${type}: ${info.count}`));
    console.log('Total types:', newTypeColorMap.size);
    console.log('Total nodes:', graph.order);
    // Check for Geo nodes specifically in the final graph
    graph.forEachNode((node, attrs) => {
      if (attrs.type === 'Geo') {
        console.log('Geo node found in final graph:', node, attrs);
      }
    });
    setGraph(graph);
    setTypeColorMap(newTypeColorMap);
    } catch (error) {
      console.error('Error processing graph data:', error);
      setGraph(null);
      setTypeColorMap(new Map());
    } finally {
      setIsProcessing(false);
    }
  };

  // For backward compatibility - still used for nodes without a type
  const getRandomColor = () => {
    const colors = [
      '#4285F4', // Google Blue
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#34A853', // Google Green
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#2196F3', // Blue
      '#03A9F4', // Light Blue
      '#00BCD4', // Cyan
      '#009688', // Teal
      '#4CAF50', // Green
      '#8BC34A', // Light Green
      '#CDDC39', // Lime
      '#FFEB3B', // Yellow
      '#FFC107', // Amber
      '#FF9800', // Orange
      '#FF5722', // Deep Orange
      '#795548', // Brown
      '#9E9E9E', // Grey
      '#607D8B'  // Blue Grey
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // No longer needed: react-graph-vis events. Sigma.js events can be handled via props if needed.

  // Convert type map to array for SigmaGraph
  const typeInfo = Array.from(typeColorMap?.entries() || []).map((entry) => {
    const [type, info] = entry as [string, {color: string, count: number}];
    return {
      type,
      color: info.color,
      count: info.count
    };
  });
  // Debug the final typeInfo that's passed to SigmaGraph
  console.log('typeInfo being passed to SigmaGraph:', typeInfo);

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Query Results</h2>
        <div className="flex space-x-2 items-center">
          <FullscreenToggle
            isFullscreen={isFullscreen}
            onToggle={() => setIsFullscreen(!isFullscreen)}
          />
          <button
            onClick={() => setViewMode('graph')}
            className={`py-2 px-4 rounded-md focus:outline-none ${
              viewMode === 'graph'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Graph View
          </button>
          {hasGeo && (
            <button
              onClick={() => setViewMode('map')}
              className={`py-2 px-4 rounded-md focus:outline-none ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Map View
            </button>
          )}
          <button
            onClick={() => setViewMode('json')}
            className={`py-2 px-4 rounded-md focus:outline-none ${
              viewMode === 'json'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            JSON View
          </button>
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center items-center h-96 bg-gray-100 rounded-md">
          <p className="text-gray-500">No query results to display. Run a query to see results.</p>
        </div>
      ) : viewMode === 'graph' ? (
        <div className="relative">
          <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-96'}`}>
            {isProcessing ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">Processing data...</p>
              </div>
            ) : !graph || graph.order === 0 ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">No graph data available to visualize.</p>
              </div>
            ) : (
              <SigmaGraph graph={graph} typeInfo={typeInfo} />
            )}
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="relative">
          <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-96'}`}>
            {isProcessing ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">Processing data...</p>
              </div>
            ) : !hasGeo || geoNodes.length === 0 ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">No geographic data available to display on map.</p>
              </div>
            ) : (
              <MapView
                nodes={geoNodes}
                edges={geoEdges}
                height="100%"
              />
            )}
          </div>
        </div>
      ) : (
        <div className={`border border-gray-300 rounded-md overflow-auto p-4 ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-96'}`}>
          <JsonView data={data} />
        </div>
      )}

      {viewMode === 'graph' && graph && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> You can zoom in/out using the mouse wheel and drag nodes to rearrange the graph.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Hover over nodes to see more details about each entity.
          </p>
        </div>
      )}

      {viewMode === 'map' && hasGeo && geoNodes.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Click on markers to view details about each location.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Use the mouse wheel to zoom in/out and drag to pan around the map.
          </p>
        </div>
      )}
    </div>
  );
}
