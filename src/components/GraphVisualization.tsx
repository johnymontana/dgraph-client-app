'use client';

import React, { useState, useEffect } from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import dynamic from 'next/dynamic';

// Dynamically import Graph to avoid SSR issues
const Graph = dynamic(() => import('react-graph-vis').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96 bg-gray-100">Loading graph visualization...</div>
});

// Styles are now included in globals.css

interface GraphVisualizationProps {
  data: any;
}

export default function GraphVisualization({ data }: GraphVisualizationProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'json'>('graph');
  const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Graph visualization options
  const options = {
    layout: {
      hierarchical: false
    },
    edges: {
      color: "#000000",
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 }
      }
    },
    nodes: {
      shape: 'dot',
      size: 16,
      font: {
        size: 12,
        color: '#000000'
      },
      borderWidth: 2
    },
    physics: {
      stabilization: {
        iterations: 100
      },
      barnesHut: {
        gravitationalConstant: -3000,
        centralGravity: 0.3,
        springLength: 95,
        springConstant: 0.04,
        damping: 0.09
      }
    },
    height: '100%',
    width: '100%'
  };
  
  // Process data for graph visualization
  useEffect(() => {
    if (data) {
      setIsProcessing(true);
      processDataForGraph(data);
    }
  }, [data]);
  
  const processDataForGraph = (queryResult: any) => {
    try {
      // Extract the actual data from the Dgraph response
      const responseData = queryResult.data;
      if (!responseData) {
        setGraphData({ nodes: [], edges: [] });
        setIsProcessing(false);
        return;
      }
      
      // Get the first query result key
      const queryKey = Object.keys(responseData)[0];
      if (!queryKey) {
        setGraphData({ nodes: [], edges: [] });
        setIsProcessing(false);
        return;
      }
      
      const queryData = responseData[queryKey];
      
      // Process the data into nodes and edges
      const nodes: any[] = [];
      const edges: any[] = [];
      const nodeMap = new Map();
      
      // Helper function to process nodes recursively
      const processNode = (node: any, parentId: string | null = null) => {
        if (!node || typeof node !== 'object') return;
        
        // Skip if node doesn't have a uid
        if (!('uid' in node)) return;
        
        // Create a unique node ID
        const nodeId = node.uid;
        
        // Check if we've already processed this node
        if (!nodeMap.has(nodeId)) {
          // Create a node object
          const nodeObj = {
            id: nodeId,
            label: node.name || node.title || `Node ${nodeId.substring(0, 8)}`,
            color: getRandomColor(),
            title: JSON.stringify(node, null, 2)
          };
          
          nodes.push(nodeObj);
          nodeMap.set(nodeId, true);
        }
        
        // If this node has a parent, create an edge
        if (parentId) {
          const edgeId = `${parentId}-${nodeId}`;
          edges.push({
            id: edgeId,
            from: parentId,
            to: nodeId
          });
        }
        
        // Process all object properties recursively
        Object.entries(node).forEach(([key, value]) => {
          // Skip uid and primitive values
          if (key === 'uid' || typeof value !== 'object' || value === null) return;
          
          // Handle arrays
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object' && 'uid' in item) {
                processNode(item, nodeId);
              }
            });
          }
          // Handle nested objects with uid
          else if (value && typeof value === 'object' && 'uid' in value) {
            processNode(value, nodeId);
          }
        });
      };
      
      // Process all top-level nodes
      if (Array.isArray(queryData)) {
        queryData.forEach(node => processNode(node));
      } else if (queryData && typeof queryData === 'object') {
        processNode(queryData);
      }
      
      setGraphData({ nodes, edges });
    } catch (error) {
      console.error('Error processing graph data:', error);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate a random color for nodes
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
  
  // Handle graph events
  const events = {
    select: function(event: any) {
      const { nodes, edges } = event;
      console.log('Selected nodes:', nodes);
      console.log('Selected edges:', edges);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Query Results</h2>
        <div className="flex space-x-2">
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
          <div className="h-96 border border-gray-300 rounded-md overflow-hidden">
            {isProcessing ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">Processing data...</p>
              </div>
            ) : graphData.nodes.length === 0 ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">No graph data available to visualize.</p>
              </div>
            ) : (
              <div style={{ height: '100%', width: '100%' }}>
                {/* Add key prop to force re-render when data changes */}
                <Graph
                  key={`graph-${Date.now()}`}
                  graph={graphData}
                  options={options}
                  events={events}
                  style={{ height: '100%', width: '100%' }}
                  getNetwork={(network) => {
                    // Store network instance if needed for future interactions
                    // You can use this to access the vis.js network instance directly
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-96 border border-gray-300 rounded-md overflow-auto p-4">
          <JsonView data={data} />
        </div>
      )}
      
      {graphData.nodes.length > 0 && viewMode === 'graph' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> You can zoom in/out using the mouse wheel and drag nodes to rearrange the graph.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Hover over nodes to see more details about each entity.
          </p>
        </div>
      )}
    </div>
  );
}
