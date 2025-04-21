'use client';

import React, { useState, useEffect } from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import Graphology from 'graphology';
import { random } from 'graphology-layout';
import dynamic from 'next/dynamic';
const SigmaGraph = dynamic(() => import('./SigmaGraph'), { ssr: false });

// Styles are now included in globals.css

interface GraphVisualizationProps {
  data: any;
}

export default function GraphVisualization({ data }: GraphVisualizationProps) {


  const [viewMode, setViewMode] = useState<'graph' | 'json'>('graph');
  const [graph, setGraph] = useState<Graphology | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // No longer needed: options for react-graph-vis
  
  // Process data for graph visualization
  useEffect(() => {
    if (data) {
      setIsProcessing(true);
      processDataForSigmaGraph(data);
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

      // Helper function to process nodes recursively
      const processNode = (node: any, parentId: string | null = null) => {
        if (!node || typeof node !== 'object') return;
        if (!('uid' in node)) return;
        const nodeId = node.uid;
        if (!nodeMap.has(nodeId)) {
          graph.addNode(nodeId, {
            label: node.name || node.title || `Node ${nodeId.substring(0, 8)}`,
            color: getRandomColor(),
            raw: node
          });
          nodeMap.set(nodeId, true);
        }
        Object.entries(node).forEach(([key, value]) => {
          if (key === 'uid' || value === null) return;
          // If value is an array of objects with 'uid', add edges for each
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
                processNode(item, nodeId);
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
            processNode(value, nodeId);
          }
        });
      };
      if (Array.isArray(queryData)) {
        queryData.forEach(node => processNode(node));
      } else if (queryData && typeof queryData === 'object') {
        processNode(queryData);
      }
      random.assign(graph);
    setGraph(graph);
    } catch (error) {
      console.error('Error processing graph data:', error);
      setGraph(null);
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
  
  // No longer needed: react-graph-vis events. Sigma.js events can be handled via props if needed.
  
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
            ) : !graph || graph.order === 0 ? (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <p className="text-gray-500">No graph data available to visualize.</p>
              </div>
            ) : (
              <SigmaGraph graph={graph} />
            )}
          </div>
        </div>
      ) : (
        <div className="h-96 border border-gray-300 rounded-md overflow-auto p-4">
          <JsonView data={data} />
        </div>
      )}
      
      {graph && graph.order > 0 && viewMode === 'graph' && (
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
