'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Graphology from 'graphology';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import FullscreenToggle from './FullscreenToggle';
import { 
  hasGeoData, 
  extractGeoNodesAndEdges, 
  applyGeoLayout,
  GeoNode,
  GeoEdge
} from '@/utils/geoUtils';

// Dynamically import components with browser-only dependencies
const MapView = dynamic(() => import('./MapView'), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full bg-gray-100">
      <p className="text-gray-500">Loading map view...</p>
    </div>
  )
});

const SigmaGraph = dynamic(() => import('./SigmaGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full bg-gray-100">
      <p className="text-gray-500">Loading graph visualization...</p>
    </div>
  )
});

interface GeoVisualizationProps {
  data: any;
}

type ViewMode = 'map' | 'graph' | 'json';

export default function GeoVisualization({ data }: GeoVisualizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graph, setGraph] = useState<Graphology | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geoNodes, setGeoNodes] = useState<GeoNode[]>([]);
  const [geoEdges, setGeoEdges] = useState<GeoEdge[]>([]);
  const [typeColorMap, setTypeColorMap] = useState<Map<string, {color: string, count: number}>>(new Map());
  const [selectedNode, setSelectedNode] = useState<GeoNode | null>(null);

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
    '#3F51B5',  // Indigo
    '#795548',  // Brown
  ];

  const defaultColor = '#9E9E9E'; // Grey (default)
  const typeColorAssignment = new Map<string, string>();
  let colorIndex = 0;

  // Helper to get color for a node type (assigns colors dynamically)
  const getColorForType = useCallback((type: string | undefined): string => {
    if (!type) return defaultColor;

    // If we haven't seen this type before, assign the next color in palette
    if (!typeColorAssignment.has(type)) {
      // Use the next color in the palette or wrap around if we run out
      const color = colorPalette[colorIndex % colorPalette.length];
      typeColorAssignment.set(type, color);
      colorIndex++;
    }

    return typeColorAssignment.get(type) || defaultColor;
  }, []);

  // Process data for geo visualization
  useEffect(() => {
    if (!data) return;
    
    setIsProcessing(true);
    
    try {
      // Process the Dgraph response data
      const processedData = extractGeoNodesAndEdges(data, getColorForType);
      setGeoNodes(processedData.nodes);
      setGeoEdges(processedData.edges);
      
      // Create a Graphology graph for Sigma visualization
      const newGraph = new Graphology();
      
      // Add nodes to the graph
      processedData.nodes.forEach(node => {
        newGraph.addNode(node.id, {
          label: node.label,
          color: node.color,
          size: 10,
          type: node.type || 'unknown',
          raw: node.raw
        });
      });
      
      // Add edges to the graph
      processedData.edges.forEach(edge => {
        if (newGraph.hasNode(edge.source) && newGraph.hasNode(edge.target)) {
          newGraph.addEdgeWithKey(edge.id, edge.source, edge.target, {
            label: edge.label,
            size: 2
          });
        }
      });
      
      // Apply geo-based layout to position nodes according to coordinates
      if (processedData.nodes.length > 0) {
        applyGeoLayout(newGraph, processedData.nodes);
      }
      
      // Build type info for legend
      const newTypeColorMap = new Map<string, {color: string, count: number}>();
      processedData.nodes.forEach(node => {
        if (node.type) {
          if (!newTypeColorMap.has(node.type)) {
            newTypeColorMap.set(node.type, {
              color: node.color,
              count: 1
            });
          } else {
            const typeInfo = newTypeColorMap.get(node.type);
            if (typeInfo) {
              newTypeColorMap.set(node.type, {
                color: typeInfo.color,
                count: typeInfo.count + 1
              });
            }
          }
        }
      });
      
      setGraph(newGraph);
      setTypeColorMap(newTypeColorMap);
    } catch (error) {
      console.error('Error processing geo data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [data, getColorForType]);

  // Handle node selection
  const handleNodeClick = (node: GeoNode) => {
    setSelectedNode(node);
  };

  // Convert type map to array for component props
  const typeInfo = Array.from(typeColorMap?.entries() || []).map((entry) => {
    const [type, info] = entry as [string, {color: string, count: number}];
    return {
      type,
      color: info.color,
      count: info.count
    };
  });

  // If no geo data is detected, don't render
  if (!data || !hasGeoData(data)) {
    return null;
  }

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 mt-6 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Geo-Spatial Visualization</h2>
        <div className="flex space-x-2 items-center">
          <FullscreenToggle
            isFullscreen={isFullscreen}
            onToggle={() => setIsFullscreen(!isFullscreen)}
          />
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

      <div className="flex gap-4">
        <div className={`${selectedNode ? 'w-3/4' : 'w-full'}`}>
          {isProcessing ? (
            <div className="flex justify-center items-center h-96 bg-gray-100 rounded-md">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-gray-500">Processing geographic data...</p>
              </div>
            </div>
          ) : viewMode === 'map' ? (
            <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-96'}`}>
              <MapView 
                nodes={geoNodes} 
                edges={geoEdges} 
                onNodeClick={handleNodeClick} 
                height="100%" 
              />
            </div>
          ) : viewMode === 'graph' ? (
            <div className={`border border-gray-300 rounded-md overflow-hidden ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-96'}`}>
              {graph && graph.order > 0 ? (
                <SigmaGraph graph={graph} typeInfo={typeInfo} />
              ) : (
                <div className="flex justify-center items-center h-full bg-gray-100">
                  <p className="text-gray-500">No graph data available to visualize.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`border border-gray-300 rounded-md overflow-auto p-4 ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-96'}`}>
              <JsonView data={data} />
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="w-1/4 border border-gray-200 rounded-md p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Node Details</h3>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="font-semibold text-gray-700">{selectedNode.label}</p>
              {selectedNode.type && (
                <p className="text-sm text-gray-600 mt-1">
                  Type: <span className="font-medium">{selectedNode.type}</span>
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Coordinates: <span className="font-medium">{selectedNode.lat.toFixed(6)}, {selectedNode.lng.toFixed(6)}</span>
              </p>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Properties</h4>
                <div className="bg-white rounded border border-gray-200 p-2 max-h-64 overflow-y-auto">
                  <JsonView data={selectedNode.raw} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex flex-wrap gap-4 mb-2">
          {typeInfo.map((item) => (
            <div key={item.type} className="flex items-center">
              <div
                className="w-4 h-4 mr-2"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700">
                {item.type} ({item.count})
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-blue-700">
          <strong>Geo-Spatial View:</strong> In map view, click on markers to see node details. In graph view,
          nodes are positioned according to their geographic coordinates.
        </p>
      </div>
    </div>
  );
}
