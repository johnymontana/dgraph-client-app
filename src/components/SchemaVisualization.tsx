'use client';

import React, { useEffect, useState } from 'react';
import Graphology from 'graphology';
import { schemaToGraph, generateTypeInfo } from '@/utils/schemaToGraph';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import SigmaGraph from './SigmaGraph';
import { useDgraph } from '@/context/DgraphContext';

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

        // Process schema_discovery to extract predicates and relationships
        if (schemaData.data.schema_discovery && schemaData.data.schema_discovery.length > 0) {
          const typePredicatesMap = new Map<string, Set<string>>();
          const typeRelationshipsMap = new Map<string, Map<string, Set<string>>>();

          schemaData.data.schema_discovery.forEach((node: any) => {
            if (node.node_type && node.node_type.length > 0) {
              const nodeType = node.node_type[0];
              
              // Extract all predicates for this type
              const predicates = new Set<string>();
              Object.keys(node).forEach(key => {
                if (key !== 'node_type' && key !== 'node_uid' && key !== 'relationship_target_type') {
                  predicates.add(key);
                }
              });

              // Store predicates for this type
              if (!typePredicatesMap.has(nodeType)) {
                typePredicatesMap.set(nodeType, new Set());
              }
              predicates.forEach(predicate => typePredicatesMap.get(nodeType)!.add(predicate));

              // Extract relationships (UID predicates that reference other types)
              Object.keys(node).forEach(key => {
                if (key !== 'node_type' && key !== 'node_uid' && key !== 'relationship_target_type') {
                  const value = node[key];
                  if (Array.isArray(value) && value.length > 0 && value[0].relationship_target_type) {
                    const targetType = value[0].relationship_target_type[0];
                    if (targetType && targetType !== nodeType) {
                      if (!typeRelationshipsMap.has(nodeType)) {
                        typeRelationshipsMap.set(nodeType, new Map());
                      }
                      if (!typeRelationshipsMap.get(nodeType)!.has(targetType)) {
                        typeRelationshipsMap.get(nodeType)!.set(targetType, new Set());
                      }
                      typeRelationshipsMap.get(nodeType)!.get(targetType)!.add(key);
                    }
                  }
                }
              });
            }
          });

          // Update node predicates in the graph
          typePredicatesMap.forEach((predicates, typeName) => {
            if (schemaGraph.hasNode(typeName)) {
              const nodeData = schemaGraph.getNodeAttributes(typeName);
              nodeData.raw.predicates = Array.from(predicates).map(predicate => ({
                name: predicate,
                type: 'string', // Default type, could be enhanced with actual type detection
                isArray: true,
                isUid: false
              }));
              schemaGraph.setNodeAttribute(typeName, 'raw', nodeData.raw);
            }
          });

          // Add edges for relationships
          const edgeMap = new Map<string, any>();
          typeRelationshipsMap.forEach((targetTypes, sourceType) => {
            targetTypes.forEach((predicates, targetType) => {
              const edgeKey = `${sourceType}-${targetType}`;
              const reverseEdgeKey = `${targetType}-${sourceType}`;
              
              if (!edgeMap.has(edgeKey) && !edgeMap.has(reverseEdgeKey)) {
                const edgeData = {
                  source: sourceType,
                  target: targetType,
                  predicates: Array.from(predicates),
                  sourceType: sourceType,
                  targetType: targetType,
                  targetTypes: [targetType]
                };
                edgeMap.set(edgeKey, edgeData);
              } else {
                // Add predicates to existing edge
                const existingEdgeKey = edgeMap.has(edgeKey) ? edgeKey : reverseEdgeKey;
                const existingEdge = edgeMap.get(existingEdgeKey);
                predicates.forEach(predicate => {
                  if (!existingEdge.predicates.includes(predicate)) {
                    existingEdge.predicates.push(predicate);
                  }
                });
              }
            });
          });

          // Add edges to the graph
          const edgesToAdd = Array.from(edgeMap.values());
          edgesToAdd.forEach((edge, index) => {
            const edgeId = `edge_${index}`;
            schemaGraph.addEdgeWithKey(edgeId, edge.source, edge.target, {
              label: edge.predicates.length === 1 ? edge.predicates[0] : `${edge.predicates.length} relationships`,
              type: 'arrow',
              color: '#4285F4', // Blue for relationships
              size: 2,
              raw: edge
            });
          });
        }

        // Ensure the graph has at least one node
        if (schemaGraph.order === 0) {
          schemaGraph.addNode('default', {
            label: 'No types found',
            type: 'default',
            color: '#999',
            size: 10,
            raw: { type: 'default', isType: false, predicates: [] }
          });
        }

        // Generate type info for the legend
        const newTypeInfo = generateTypeInfo(schemaGraph);
        setTypeInfo(newTypeInfo);
        setGraph(schemaGraph);
        setError(null);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error processing schema data:', err);
        setError('Failed to process schema data: ' + err.message);
        setIsLoading(false);
      }
    } else {
                    // If no schemaData, try to process the schemaText prop
       if (schemaText && schemaText.trim() !== '' && schemaText !== '# No schema found or empty schema') {
         try {
           setIsLoading(true);
           const schemaGraph = schemaToGraph(schemaText);
           
           if (schemaGraph && schemaGraph.order > 0) {
             setGraph(schemaGraph);
             setTypeInfo(generateTypeInfo(schemaGraph));
             setError(null);
           } else {
             setError('No valid schema found in the provided text.');
           }
         } catch (err: any) {
           console.error('Error processing schema text:', err);
           setError('Failed to process schema text: ' + err.message);
         } finally {
           setIsLoading(false);
         }
       } else {
         setIsLoading(false);
       }
    }
  }, [schemaData, schemaText]);

  // Set initial loading state if no schemaData
  useEffect(() => {
    if (!schemaData && !schemaText) {
      setIsLoading(false);
    }
  }, [schemaData, schemaText]);

  // Process JSON data for JSON view
  useEffect(() => {
    if (schemaData && schemaData.data) {
      setJsonData(schemaData.data);
    }
  }, [schemaData]);

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

  return (
    <div className="h-full flex flex-col" style={{ minHeight: "600px" }}>
      <div className="flex justify-between items-start mb-3 flex-shrink-0">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Schema Visualization</h3>
            <div className="flex space-x-2 items-center">
              <button
                onClick={refreshSchemaData}
                disabled={isLoading}
                className={`py-1 px-3 rounded-md focus:outline-none text-sm ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title="Refresh schema data from Dgraph"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Loading...
                  </div>
                ) : (
                  '🔄 Refresh'
                )}
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`py-1 px-3 rounded-md focus:outline-none text-sm ${
                  viewMode === 'graph'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Graph
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`py-1 px-3 rounded-md focus:outline-none text-sm ${
                  viewMode === 'json'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                JSON
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Interactive database structure • Click nodes/edges for details
            </p>
            {viewMode === 'graph' && graph && typeInfo.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {typeInfo.slice(0, 4).map((item) => (
                  <div key={item.type} className="flex items-center">
                    <div
                      className="w-2 h-2 mr-1"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-600">
                      {item.type} ({item.count})
                    </span>
                  </div>
                ))}
                {typeInfo.length > 4 && (
                  <span className="text-xs text-gray-500">+{typeInfo.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-3 flex-shrink-0">
          {error}
        </div>
      )}

      {viewMode === 'graph' ? (
        <div className="border border-gray-300 rounded-md flex-1 overflow-hidden" style={{ height: "500px", minHeight: "500px" }}>
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
        <div className="border border-gray-300 rounded-md overflow-auto p-4 flex-1" style={{ height: "500px", minHeight: "500px" }}>
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


    </div>
  );
}
