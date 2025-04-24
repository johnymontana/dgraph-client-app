'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Graphology from 'graphology';
import { schemaToGraph, generateTypeInfo } from '@/utils/schemaToGraph';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import FullscreenToggle from './FullscreenToggle';
import dynamic from 'next/dynamic';

// Dynamically import SigmaGraph to avoid SSR issues with WebGL
const SigmaGraph = dynamic(() => import('./SigmaGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full bg-gray-100">
      <p className="text-gray-500">Loading graph visualization...</p>
    </div>
  )
});

interface SchemaVisualizationProps {
  schemaText: string;
}

export default function SchemaVisualization({ schemaText }: SchemaVisualizationProps) {
  const [graph, setGraph] = useState<Graphology | null>(null);
  const [typeInfo, setTypeInfo] = useState<Array<{ type: string; color: string; count: number }>>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'json'>('graph');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);

  useEffect(() => {
    if (!schemaText) {
      setGraph(null);
      setTypeInfo([]);
      setJsonData(null);
      return;
    }

    try {
      console.log('Schema text to parse:', schemaText);
      
      // Convert schema to graph
      const schemaGraph = schemaToGraph(schemaText);
      console.log('Schema graph created:', {
        nodeCount: schemaGraph.order,
        edgeCount: schemaGraph.size,
        nodes: Array.from(schemaGraph.nodes()),
        edges: Array.from(schemaGraph.edges())
      });
      
      setGraph(schemaGraph);
      
      // Generate type info for the visualization legend
      const typeInfoData = generateTypeInfo(schemaGraph);
      console.log('Type info generated:', typeInfoData);
      setTypeInfo(typeInfoData);
      
      // Create JSON representation for JSON view
      // Convert nodeEntries and edgeEntries iterators to arrays properly
      const nodes: any[] = [];
      schemaGraph.forEachNode((node, attributes) => {
        nodes.push({
          id: node,
          ...attributes
        });
      });
      
      const edges: any[] = [];
      schemaGraph.forEachEdge((edge, attributes, source, target) => {
        edges.push({
          id: edge,
          source,
          target,
          ...attributes
        });
      });
      
      const jsonRepresentation = {
        nodes,
        edges
      };
      setJsonData(jsonRepresentation);
      
      setError(null);
    } catch (err) {
      console.error('Error converting schema to graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse schema');
      setGraph(null);
      setTypeInfo([]);
    }
  }, [schemaText]);

  if (!schemaText) {
    return (
      <div className="bg-gray-100 rounded-md p-4 text-center text-gray-500">
        No schema available to visualize. Update your schema or fetch it from Dgraph.
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Schema Visualization</h2>
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {viewMode === 'graph' ? (
        <div className={`border border-gray-300 rounded-md ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-[500px]'}`}>
          {graph ? (
            <SigmaGraph graph={graph} typeInfo={typeInfo} />
          ) : (
            <div className="flex justify-center items-center h-full bg-gray-100">
              <p className="text-gray-500">No schema graph available to visualize.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={`border border-gray-300 rounded-md overflow-auto p-4 ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-[500px]'}`}>
          {jsonData ? (
            <JsonView data={jsonData} />
          ) : (
            <div className="flex justify-center items-center h-full bg-gray-100">
              <p className="text-gray-500">No schema data available.</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'graph' && graph && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Legend:</strong> Red nodes are types, blue nodes are predicates, 
            green nodes are scalar types, and yellow nodes represent UID references.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            You can zoom in/out using the mouse wheel and drag nodes to rearrange the graph.
          </p>
        </div>
      )}
    </div>
  );
}
