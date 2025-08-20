'use client';

import React, { useState, useEffect } from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import Graphology from 'graphology';

import forceAtlas2 from 'graphology-layout-forceatlas2';
import dynamic from 'next/dynamic';
import FullscreenToggle from './FullscreenToggle';
import { hasGeoData, extractGeoNodesAndEdges } from '@/utils/geoUtils';
import '@/styles/toast.css';
import SigmaGraph from './SigmaGraph';
import PropertyAnalysis from './PropertyAnalysis';
import { Tabs } from '@chakra-ui/react';

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
  const [viewMode, setViewMode] = useState<'graph' | 'json' | 'map' | 'analysis'>('graph');
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
          // Use the next color in the palette or wrap around if we run out
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
            size: 8,
            type: nodeTypeStr || 'Unknown'
          });

          // Mark this node as processed
          nodeMap.set(nodeId, true);

          // Process nested objects recursively
          for (const [key, value] of Object.entries(node)) {
            if (key === 'uid' || key === 'dgraph.type' || key === 'type') continue;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
              // This is a nested object, process it recursively
              addNodes(value, depth + 1);
            } else if (Array.isArray(value)) {
              // This is an array, process each item
              value.forEach((item, index) => {
                if (item && typeof item === 'object') {
                  addNodes(item, depth + 1);
                }
              });
            }
          }
        }
      };

      // Second pass: add edges between connected nodes
      const addEdges = (node: any, parentId?: string, edgeLabel?: string) => {
        if (!node || typeof node !== 'object' || !('uid' in node)) return;

        const nodeId = node.uid;

                 // Add edge from parent if we have one
         if (parentId && edgeLabel) {
           const edgeId = `${parentId}-${nodeId}-${edgeLabel}`;
           if (!graph.hasEdge(edgeId)) {
             graph.addEdgeWithKey(edgeId, parentId, nodeId, {
               label: edgeLabel,
               color: '#ccc',
               size: 1
             });
           }
         }

        // Process nested objects recursively
        for (const [key, value] of Object.entries(node)) {
          if (key === 'uid' || key === 'dgraph.type' || key === 'type') continue;

          if (value && typeof value === 'object' && !Array.isArray(value)) {
            // This is a nested object, add edge and process recursively
            if ('uid' in value) {
              addEdges(value, nodeId, key);
            }
          } else if (Array.isArray(value)) {
            // This is an array, process each item
            value.forEach((item, index) => {
              if (item && typeof item === 'object' && 'uid' in item) {
                addEdges(item, nodeId, key);
              }
            });
          }
        }
      };

      // Process all data recursively
      if (Array.isArray(queryData)) {
        queryData.forEach(item => {
          addNodes(item);
        });
        queryData.forEach(item => {
          addEdges(item);
        });
      } else {
        addNodes(queryData);
        addEdges(queryData);
      }

             // Apply force layout
       forceAtlas2.assign(graph, {
         iterations: 100,
         settings: forceAtlas2.inferSettings(graph.order)
       });

      console.log("Graph created with", graph.order, "nodes and", graph.size, "edges");
      console.log("Type color map:", Object.fromEntries(newTypeColorMap));

      setGraph(graph);
      setTypeColorMap(newTypeColorMap);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing data for graph:', error);
      setGraph(null);
      setIsProcessing(false);
    }
  };

  // Helper function to generate random colors
  const getRandomColor = () => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#673AB7',
      '#FF9800', '#009688', '#E91E63', '#9C27B0', '#CDDC39',
      '#00BCD4', '#8BC34A', '#FFC107', '#3F51B5', '#795548'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Type info for SigmaGraph
  const typeInfo = Array.from(typeColorMap.entries()).map(([type, info]) => ({
    type,
    color: info.color,
    count: info.count
  }));

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex justify-between items-center p-4 border-b border-gray-300">
          <h2 className="text-xl font-bold">Query Results - Fullscreen</h2>
          <FullscreenToggle
            isFullscreen={isFullscreen}
            onToggle={() => setIsFullscreen(!isFullscreen)}
          />
        </div>
        <div className="p-4 h-[calc(100vh-80px)]">
          <GraphVisualization data={data} />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Query Results</h2>
        <div className="flex items-center">
          <FullscreenToggle
            isFullscreen={isFullscreen}
            onToggle={() => setIsFullscreen(!isFullscreen)}
          />
        </div>
      </div>

      <Tabs.Root value={viewMode} onValueChange={(details) => setViewMode(details.value as any)}>
        <Tabs.List>
          <Tabs.Trigger value="graph">Graph View</Tabs.Trigger>
          {hasGeo && <Tabs.Trigger value="map">Map View</Tabs.Trigger>}
          <Tabs.Trigger value="json">JSON View</Tabs.Trigger>
          <Tabs.Trigger value="analysis">Analysis</Tabs.Trigger>
        </Tabs.List>

        {!data ? (
          <Tabs.Content value="graph">
            <div className="flex justify-center items-center h-full bg-gray-100 rounded-md" style={{ minHeight: "500px" }}>
              <p className="text-gray-500">No query results to display. Run a query to see results.</p>
            </div>
          </Tabs.Content>
        ) : (
          <>
            <Tabs.Content value="graph">
              <div className="relative">
                <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-full'}`} style={{ minHeight: "500px", height: "500px" }}>
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
            </Tabs.Content>

            <Tabs.Content value="map">
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
            </Tabs.Content>

            <Tabs.Content value="json">
              <div
                className={`border border-gray-300 rounded-md json-container ${isFullscreen ? 'h-[calc(100vh-130px)]' : ''}`}
                style={{
                  height: isFullscreen ? undefined : "600px",
                  minHeight: "500px",
                  maxHeight: isFullscreen ? undefined : "600px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  position: "relative"
                }}
              >
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Data
                  </button>
                </div>
                <div className="p-4">
                  <JsonView data={data} />
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="analysis">
              <div className="relative">
                <div
                  className={`border border-gray-300 rounded-md analysis-container ${isFullscreen ? 'h-[calc(100vh-130px)]' : ''}`}
                  style={{
                    height: isFullscreen ? undefined : "600px",
                    minHeight: "500px",
                    maxHeight: isFullscreen ? undefined : "600px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    position: "relative"
                  }}
                >
                  <div className="p-4">
                    <PropertyAnalysis data={data} />
                  </div>
                </div>
              </div>
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>

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

      {viewMode === 'analysis' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Property analysis shows distribution patterns and statistics for your query results.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Hover over sparkline bars to see value distributions, and explore numeric vs categorical data insights.
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