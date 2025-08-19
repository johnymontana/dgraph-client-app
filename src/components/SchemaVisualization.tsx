'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Graphology from 'graphology';
import { schemaToGraph, generateTypeInfo, ensureNonEmptyGraph } from '@/utils/schemaToGraph';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import FullscreenToggle from './FullscreenToggle';
import dynamic from 'next/dynamic';
import SigmaGraph from './SigmaGraph';
import { useDgraph } from '@/context/DgraphContext';

// Dynamically import SigmaGraph to avoid SSR issues with WebGL
// const SigmaGraph = dynamic(() => import('./SigmaGraph'), {
//   ssr: false,
//   loading: () => (
//     <div className="flex justify-center items-center h-full bg-gray-100">
//       <p className="text-gray-500">Loading graph visualization...</p>
//     </div>
//   )
// });

interface SchemaVisualizationProps {
  schemaText: string;
}

interface TypeNodeData {
  id: string;
  label: string;
  type: string;
  predicates: Array<{
    name: string;
    type: string;
    isArray: boolean;
    isUid: boolean;
    referencedType?: string;
  }>;
  color: string;
  size: number;
  raw?: {
    type: string;
    isType: boolean;
    count?: number;
    predicates: any[];
  };
}

interface SelectedElement {
  type: 'node';
  id: string;
  data: TypeNodeData;
}

export default function SchemaVisualization({ schemaText }: SchemaVisualizationProps) {
  const { schemaData, refreshSchemaData } = useDgraph();
  const [graph, setGraph] = useState<Graphology | null>(null);
  const [typeInfo, setTypeInfo] = useState<Array<{ type: string; color: string; count: number }>>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'json'>('graph');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

    // Handle schemaData from context
  useEffect(() => {
    if (schemaData && schemaData.data) {
      setIsLoading(true);
      try {
        console.log('Processing schema data from DQL query:', schemaData);
        
        // Convert the DQL query result to a graph
        const schemaGraph = new Graphology();
        
        // Process node_type_counts for the graph nodes
        if (schemaData.data.node_type_counts && schemaData.data.node_type_counts.length > 0) {
          schemaData.data.node_type_counts.forEach((typeGroup: any) => {
            if (typeGroup['@groupby'] && typeGroup['@groupby'].length > 0) {
              // The @groupby contains an array of objects with dgraph.type and count
              typeGroup['@groupby'].forEach((typeInfo: any) => {
                const typeName = typeInfo['dgraph.type'];
                const count = typeInfo.count || 0;
                
                if (typeName) {
                  // Add the type node with count information
                  schemaGraph.addNode(typeName, {
                    label: `${typeName} (${count})`,
                    type: 'type',
                    color: '#EA4335', // Red for types
                    size: Math.max(12, Math.min(20, 12 + count / 100)), // Size based on count, adjusted scale
                    raw: { 
                      type: typeName,
                      isType: true,
                      count: count,
                      predicates: []
                    }
                  });
                }
              });
            }
          });
        }
        
        // Process schema_discovery to extract predicate information and create edges
        if (schemaData.data.schema_discovery && schemaData.data.schema_discovery.length > 0) {
          const typePredicates: Record<string, Set<string>> = {};
          const typeRelationships: Record<string, Record<string, string[]>> = {};
          const edgeMap: Record<string, {source: string, target: string, predicates: string[], targetTypes: string[]}> = {};
          
          schemaData.data.schema_discovery.forEach((node: any) => {
            if (node.node_type && node.node_type.length > 0) {
              const nodeType = node.node_type[0];
              
              // Initialize predicates set for this type if it doesn't exist
              if (!typePredicates[nodeType]) {
                typePredicates[nodeType] = new Set();
              }
              if (!typeRelationships[nodeType]) {
                typeRelationships[nodeType] = {};
              }
              
              // Extract all predicates from the expanded node (excluding special fields)
              Object.keys(node).forEach(key => {
                if (key !== 'node_type' && key !== 'node_uid' && !key.startsWith('relationship_target_type')) {
                  typePredicates[nodeType].add(key);
                  
                  // Check if this predicate has relationship target types
                  if (node[key] && Array.isArray(node[key])) {
                    const targetTypes = node[key]
                      .map((rel: any) => rel.relationship_target_type)
                      .filter((types: any) => types && types.length > 0)
                      .flat();
                    
                    if (targetTypes.length > 0) {
                      typeRelationships[nodeType][key] = targetTypes;
                      
                      // Group edges by source-target pair
                      targetTypes.forEach(targetType => {
                        if (targetType !== nodeType) { // Avoid self-loops
                          const edgeKey = `${nodeType}->${targetType}`;
                          if (!edgeMap[edgeKey]) {
                            edgeMap[edgeKey] = {
                              source: nodeType,
                              target: targetType,
                              predicates: [],
                              targetTypes: []
                            };
                          }
                          edgeMap[edgeKey].predicates.push(key);
                          edgeMap[edgeKey].targetTypes.push(...targetTypes);
                        }
                      });
                    }
                  }
                }
              });
            }
          });
          
          // Add edges to the graph (deduplicated)
          Object.entries(edgeMap).forEach(([edgeKey, edge], index) => {
            const edgeId = `edge_${index}`;
            const uniquePredicates = [...new Set(edge.predicates)];
            const uniqueTargetTypes = [...new Set(edge.targetTypes)];
            
            schemaGraph.addEdgeWithKey(edgeId, edge.source, edge.target, {
              label: uniquePredicates.length === 1 ? uniquePredicates[0] : `${uniquePredicates.length} relationships`,
              type: 'arrow', // Use standard Sigma edge type
              color: '#4285F4', // Blue for relationships
              size: 2,
              raw: {
                predicates: uniquePredicates,
                sourceType: edge.source,
                targetType: edge.target,
                targetTypes: uniqueTargetTypes
              }
            });
          });
          
          // Update the raw.predicates for each node with the discovered predicates
          schemaGraph.forEachNode((nodeId, attributes) => {
            if (typePredicates[nodeId]) {
              const predicatesArray = Array.from(typePredicates[nodeId]).map(predName => {
                const relationships = typeRelationships[nodeId]?.[predName] || [];
                const isUid = relationships.length > 0;
                const isArray = true; // Most predicates in Dgraph are arrays
                
                return {
                  name: predName,
                  type: isUid ? 'uid' : 'string',
                  isArray: isArray,
                  isUid: isUid,
                  referencedType: relationships.length > 0 ? relationships[0] : undefined
                };
              });
              
              // Update the node attributes
              console.log(`Setting predicates for node ${nodeId}:`, predicatesArray);
              schemaGraph.setNodeAttribute(nodeId, 'raw', {
                ...attributes.raw,
                predicates: predicatesArray
              });
            }
          });
        }
        
        if (schemaGraph.order > 0) {
          setGraph(schemaGraph);
          const typeInfoData = generateTypeInfo(schemaGraph);
          setTypeInfo(typeInfoData);
          setError(null);
          
          // Create JSON representation
          const nodes: any[] = [];
          schemaGraph.forEachNode((node, attributes) => {
            nodes.push({ id: node, ...attributes });
          });
          
          const edges: any[] = [];
          schemaGraph.forEachEdge((edge, attributes, source, target) => {
            edges.push({ id: edge, source, target, ...attributes });
          });
          
          setJsonData({ nodes, edges });
        } else {
          // Fallback to demo graph
          const demoGraph = ensureNonEmptyGraph(schemaGraph);
          setGraph(demoGraph);
          setTypeInfo(generateTypeInfo(demoGraph));
          setError('No types found in schema data - showing example visualization');
        }
        
        // Set loading to false after processing is complete
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing schema data:', err);
        setError('Failed to process schema data from DQL query');
        
        // Fallback to demo graph
        const emptyGraph = new Graphology();
        const demoGraph = ensureNonEmptyGraph(emptyGraph);
        setGraph(demoGraph);
        setTypeInfo(generateTypeInfo(demoGraph));
        setIsLoading(false);
      }
    } else {
      // No schema data available
      setIsLoading(false);
    }
  }, [schemaData]);

  // Set initial loading state when component mounts
  useEffect(() => {
    if (!schemaData) {
      setIsLoading(true);
    }
  }, []);

  useEffect(() => {
    if (!schemaText || schemaText.trim() === '' || schemaText.trim() === '# No schema found or empty schema') {
      // Create a demo graph instead of showing nothing
      const emptyGraph = new Graphology();
      const demoGraph = ensureNonEmptyGraph(emptyGraph);
      setGraph(demoGraph);
      const demoTypeInfo = generateTypeInfo(demoGraph);
      setTypeInfo(demoTypeInfo);
      
      // Create JSON for the demo graph
      const nodes: any[] = [];
      demoGraph.forEachNode((node, attributes) => {
        nodes.push({ id: node, ...attributes });
      });
      
      const edges: any[] = [];
      demoGraph.forEachEdge((edge, attributes, source, target) => {
        edges.push({ id: edge, source, target, ...attributes });
      });
      
      setJsonData({ nodes, edges });
      setError('No schema defined - showing example schema visualization');
      return;
    }

    try {
      console.log('Schema text to parse:', schemaText);

      // Convert schema to graph
      const schemaGraph = schemaToGraph(schemaText);

      // If the graph is empty (no nodes were created), show a demo graph instead
      if (schemaGraph.order === 0) {
        console.log('Schema parsing produced empty graph, using demo graph');
        const demoGraph = ensureNonEmptyGraph(schemaGraph);
        setGraph(demoGraph);
        const demoTypeInfo = generateTypeInfo(demoGraph);
        setTypeInfo(demoTypeInfo);
        setError('Could not generate schema graph - showing example visualization');
      } else {
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
        setError(null);
      }
      
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
    } catch (err) {
      console.error('Error converting schema to graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse schema');
      
      // Create a demo graph on error
      const emptyGraph = new Graphology();
      const demoGraph = ensureNonEmptyGraph(emptyGraph);
      setGraph(demoGraph);
      setTypeInfo(generateTypeInfo(demoGraph));
      
      // Create JSON for the demo graph
      const nodes: any[] = [];
      demoGraph.forEachNode((node, attributes) => {
        nodes.push({ id: node, ...attributes });
      });
      
      const edges: any[] = [];
      demoGraph.forEachEdge((edge, attributes, source, target) => {
        edges.push({ id: edge, source, target, ...attributes });
      });
      
      setJsonData({ nodes, edges });
    }
  }, [schemaText]);

  // Property display component for showing type details
  const PropertyDisplay: React.FC<{ selectedElement: SelectedElement | null, onClose: () => void }> = ({ selectedElement, onClose }) => {
    if (!selectedElement) return null;
    const { data } = selectedElement;

    return (
      <div className="fixed right-4 top-20 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            🔵 {data.label} Type
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          {/* Type Information */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Type Details:</h4>
            <div className="text-sm text-gray-600">
              <p><strong>ID:</strong> {data.id}</p>
              <p><strong>Type:</strong> {data.type}</p>
              <p><strong>Size:</strong> {data.size}</p>
              {data.raw?.count !== undefined && (
                <p><strong>Instance Count:</strong> {data.raw.count}</p>
              )}
            </div>
          </div>

          {/* Predicates */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Predicates ({data.predicates.length}):</h4>
            {data.predicates.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No predicates defined</p>
            ) : (
              <div className="space-y-2">
                {data.predicates.map((predicate, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">{predicate.name}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {predicate.type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {predicate.isArray && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          Array
                        </span>
                      )}
                      {predicate.isUid && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          UID
                        </span>
                      )}
                    </div>
                    {predicate.referencedType && (
                      <p className="text-xs text-gray-600 mt-1">
                        References: <span className="font-medium">{predicate.referencedType}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Edge information display component
  const EdgeDisplay: React.FC<{ selectedEdge: any | null, onClose: () => void }> = ({ selectedEdge, onClose }) => {
    if (!selectedEdge) return null;
    
    const predicates = selectedEdge.raw?.predicates || [selectedEdge.label];
    const isMultiPredicate = predicates.length > 1;
    
    return (
      <div className="fixed right-4 top-20 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            🔗 {isMultiPredicate ? `${predicates.length} Relationships` : selectedEdge.label}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Connection Details:</h4>
            <div className="text-sm text-gray-600">
              <p><strong>Source Type:</strong> {selectedEdge.raw?.sourceType}</p>
              <p><strong>Target Type:</strong> {selectedEdge.raw?.targetType}</p>
              <p><strong>Edge Type:</strong> {selectedEdge.type} (arrow)</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Predicates ({predicates.length}):</h4>
            <div className="space-y-2">
              {predicates.map((predicate: string, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded-md border border-gray-200">
                  <span className="font-medium text-gray-800">{predicate}</span>
                </div>
              ))}
            </div>
          </div>
          
          {selectedEdge.raw?.targetTypes && selectedEdge.raw.targetTypes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Referenced Types:</h4>
              <div className="space-y-1">
                {selectedEdge.raw.targetTypes.map((targetType: string, index: number) => (
                  <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm mr-2 mb-1">
                    {targetType}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Always render the visualization - we now show an example graph when no schema is available

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Schema Visualization</h2>
        <div className="flex space-x-2 items-center">
          <button
            onClick={refreshSchemaData}
            disabled={isLoading}
            className={`py-2 px-4 rounded-md focus:outline-none ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Refresh schema data from Dgraph"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              '🔄 Refresh'
            )}
          </button>
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
        <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {viewMode === 'graph' ? (
        <div className={`border border-gray-300 rounded-md ${isFullscreen ? 'h-[calc(100vh-130px)]' : 'h-[500px]'}`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing schema data...</p>
                <p className="text-sm text-gray-500 mt-2">Building graph visualization</p>
              </div>
            </div>
          ) : graph ? (
            <SigmaGraph 
              graph={graph} 
              typeInfo={typeInfo} 
              onNodeClick={(nodeId, nodeData) => {
                console.log('Node clicked:', nodeId, nodeData);
                console.log('Node raw data:', nodeData.raw);
                console.log('Predicates from raw:', nodeData.raw?.predicates);
                
                // Extract predicates from the node's raw data
                const predicates = nodeData.raw?.predicates || [];
                console.log('Final predicates array:', predicates);
                
                const typeNodeData: TypeNodeData = {
                  id: nodeId,
                  label: nodeData.label,
                  type: nodeData.type,
                  predicates: predicates,
                  color: nodeData.color,
                  size: nodeData.size,
                  raw: nodeData.raw
                };

                console.log('Setting selected element:', typeNodeData);
                setSelectedElement({
                  type: 'node',
                  id: nodeId,
                  data: typeNodeData
                });
                setSelectedEdge(null); // Clear edge selection
              }}
              onEdgeClick={(edgeId, edgeData) => {
                console.log('Edge clicked:', edgeId, edgeData);
                setSelectedEdge(edgeData);
                setSelectedElement(null); // Clear node selection
              }}
            />
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

      {/* Property Display Panel */}
      {selectedElement && (
        <PropertyDisplay 
          selectedElement={selectedElement} 
          onClose={() => setSelectedElement(null)} 
        />
      )}
      
      {/* Edge Display Panel */}
      {selectedEdge && (
        <EdgeDisplay 
          selectedEdge={selectedEdge} 
          onClose={() => setSelectedEdge(null)} 
        />
      )}

      {viewMode === 'graph' && graph && (
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
            <strong>Legend:</strong> Red nodes are types, blue nodes are predicates/fields, 
            green nodes are scalar types, yellow nodes represent UID references, and blue arrows show relationships between types.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Click on any type node (red) to see its predicates and properties.</strong>
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Click on any relationship edge (blue arrows) to see connection details.</strong>
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Data Source:</strong> Schema visualization shows types with instance counts from DQL query.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            You can zoom in/out using the mouse wheel and drag nodes to rearrange the graph.
          </p>
        </div>
      )}
    </div>
  );
}
