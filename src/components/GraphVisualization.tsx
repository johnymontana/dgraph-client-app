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
import '@/styles/toast.css';
import SigmaGraph from './SigmaGraph';


// // Dynamically import SigmaGraph to avoid SSR issues with WebGL
// const SigmaGraph = dynamic(() => import('./SigmaGraph'), {
//   ssr: false,
//   loading: () => (
//     <div className="flex justify-center items-center h-full bg-gray-100">
//       <p className="text-gray-500">Loading graph visualization...</p>
//     </div>
//   )
// });

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

// Simple Toast Notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    // Auto-close toast after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div
        className={`flex items-center p-4 rounded-md shadow-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
      >
        {type === 'success' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {message}
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    console.log("Processing data for SigmaGraph");
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
      const addNodes = (node: any, depth = 0) => {
        // Skip invalid nodes
        if (!node || typeof node !== 'object') return;
        if (!('uid' in node)) return;

        const nodeId = node.uid;
        const nodeType = node['dgraph.type'] || node.type;

        console.log(`Processing node at depth ${depth}:`, nodeId, 'type:', nodeType, 'properties:', Object.keys(node));

        // Process this node if we haven't seen it before
        if (!nodeMap.has(nodeId)) {
          // Extract node type (handle array or string)
          let nodeTypeStr;

          if (Array.isArray(nodeType) && nodeType.length > 0) {
            nodeTypeStr = nodeType[0];
          } else if (typeof nodeType === 'string') {
            nodeTypeStr = nodeType;
          } else {
            // If no type is found, try to infer from object structure
            const keys = Object.keys(node);
            if (keys.some(k => k.includes('.'))) {
              // Use the prefix before the first dot as a type guess
              const typedKey = keys.find(k => k.includes('.'));
              if (typedKey) {
                nodeTypeStr = typedKey.split('.')[0];
                console.log(`Inferred type ${nodeTypeStr} from property ${typedKey}`);
              } else {
                nodeTypeStr = 'Unknown';
              }
            } else {
              nodeTypeStr = 'Unknown';
            }
          }

          // Debug logging
          console.log(`Adding node ${nodeId} with type ${nodeTypeStr}`);

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

          // Create a meaningful label from available properties
          let nodeLabel = node.name || node.title;
          if (!nodeLabel) {
            // Try to find a property that might serve as a good label
            for (const [key, value] of Object.entries(node)) {
              if (typeof value === 'string' && key.toLowerCase().includes('name') && value.length < 30) {
                nodeLabel = value;
                break;
              }
            }
            if (!nodeLabel) {
              nodeLabel = `${nodeTypeStr || 'Node'} ${nodeId.substring(0, 8)}`;
            }
          }

          // Add the node to the graph
          graph.addNode(nodeId, {
            label: nodeLabel,
            color: nodeTypeStr ? getColorForType(nodeTypeStr) : defaultColor,
            raw: node,
            type: nodeTypeStr
          });

          nodeMap.set(nodeId, true);
        }

        // Recursively process nested nodes
        Object.entries(node).forEach(([key, value]) => {
          if (key === 'uid' || value === null) return;

          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object' && 'uid' in item) {
                addNodes(item, depth + 1);
              }
            });
          } else if (typeof value === 'object' && 'uid' in value) {
            addNodes(value, depth + 1);
          }
        });
      };
      // Second pass: add all edges recursively
      const addEdges = (node: any, depth = 0) => {
        // Skip invalid nodes
        if (!node || typeof node !== 'object') return;
        if (!('uid' in node)) return;

        const nodeId = node.uid;
        console.log(`Adding edges for node ${nodeId} at depth ${depth}`);

        // Process each property of the node
        Object.entries(node).forEach(([key, value]) => {
          // Skip uid and null values
          if (key === 'uid' || key === 'dgraph.type' || value === null) return;

          // Handle array of objects (one-to-many relationships)
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (item && typeof item === 'object' && 'uid' in item) {
                const targetId = item.uid;

                // Create a more descriptive edge label from the property name
                let edgeLabel = key;
                // Try to extract a more readable label by removing type prefixes
                if (key.includes('.')) {
                  edgeLabel = key.split('.').slice(1).join('.');
                }

                // Only add edges between nodes that exist and are different
                if (graph.hasNode(nodeId) && graph.hasNode(targetId) && nodeId !== targetId) {
                  const edgeId = `${nodeId}-${targetId}-${key}-${index}`;
                  if (!graph.hasEdge(edgeId)) {
                    console.log(`Adding edge from ${nodeId} to ${targetId} with label ${edgeLabel}`);
                    graph.addEdgeWithKey(edgeId, nodeId, targetId, { 
                      label: edgeLabel,
                      key: key, // Store original property name
                      index: index // Store array index for reference
                    });
                  }
                }

                // Process nested objects recursively
                addEdges(item, depth + 1);
              }
            });
          } 
          // Handle single object (one-to-one relationship)
          else if (typeof value === 'object' && 'uid' in value) {
            const targetId = value.uid;

            // Create a more descriptive edge label
            let edgeLabel = key;
            if (key.includes('.')) {
              edgeLabel = key.split('.').slice(1).join('.');
            }

            // Only add edges between nodes that exist and are different
            if (graph.hasNode(nodeId) && graph.hasNode(targetId) && nodeId !== targetId) {
              const edgeId = `${nodeId}-${targetId}-${key}`;
              if (!graph.hasEdge(edgeId)) {
                console.log(`Adding edge from ${nodeId} to ${targetId} with label ${edgeLabel}`);
                graph.addEdgeWithKey(edgeId, nodeId, targetId, { 
                  label: edgeLabel,
                  key: key // Store original property name
                });
              }
            }

            // Process nested object recursively
            addEdges(value, depth + 1);
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

      console.log("This is where I commented out initial layout to position nodes");
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
    //   graph.forEachNode((node, attrs) => {
    //     if (typeof attrs.x !== 'number' || typeof attrs.y !== 'number') {
    //       graph.mergeNodeAttributes(node, {
    //         x: Math.random(),
    //         y: Math.random()
    //       });
    //     }
    //   });
    // // Debug info for node types
    // console.log('Types detected:', Array.from(newTypeColorMap.keys()));
    // console.log('Type counts:', Array.from(newTypeColorMap.entries()).map(([type, info]) => `${type}: ${info.count}`));
    // console.log('Total types:', newTypeColorMap.size);
    // console.log('Total nodes:', graph.order);
    // // Check for Geo nodes specifically in the final graph
    // graph.forEachNode((node, attrs) => {
    //   if (attrs.type === 'Geo') {
    //     console.log('Geo node found in final graph:', node, attrs);
    //   }
    // });
    setGraph(graph);
    setTypeColorMap(newTypeColorMap);
    } catch (error) {
       console.error('Error processing graph data:', error);
    //   setGraph(null);
    //   setTypeColorMap(new Map());
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
        <div className="flex justify-center items-center h-full bg-gray-100 rounded-md" style={{ minHeight: "500px" }}>
          <p className="text-gray-500">No query results to display. Run a query to see results.</p>
        </div>
      ) : viewMode === 'graph' ? (
        <div className="relative">
          <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-full'}`} style={{ border: "2px solid green", minHeight: "500px" }}>
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
        <div className="relative map-container-wrapper">
          <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-full'}`} style={{ position: 'relative', minHeight: "500px" }}>

            {isProcessing ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">Processing data...</p>
              </div>
            ) : !hasGeo || geoNodes.length === 0 ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">No geographic data available to display on map.</p>
              </div>
            ) : (
              <div className="h-full">
                <MapView
                  nodes={geoNodes}
                  edges={geoEdges}
                  height="100%"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`border border-gray-300 rounded-md overflow-auto ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-full'}`} style={{ minHeight: "500px" }}>
          <div className="flex justify-end p-2 bg-gray-50 border-b border-gray-300">
            <button
              onClick={() => {
                // Copy JSON data to clipboard
                const jsonString = JSON.stringify(data, null, 2);
                navigator.clipboard.writeText(jsonString)
                  .then(() => {
                    // Show toast notification for success
                    setToast({
                      message: 'JSON data copied to clipboard',
                      type: 'success'
                    });
                  })
                  .catch(err => {
                    console.error('Failed to copy JSON data:', err);
                    setToast({
                      message: 'Failed to copy JSON data to clipboard',
                      type: 'error'
                    });
                  });
              }}
              className="flex items-center px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Data
            </button>
          </div>
          <div className="p-4">
            <JsonView data={data} />
          </div>
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

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
