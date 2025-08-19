
'use client';

import React, { useEffect, useState, useMemo } from "react";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { ZoomControl, FullScreenControl } from "@react-sigma/core";
import Graphology from "graphology";
import "@react-sigma/core/lib/style.css";

interface TypeInfo {
  type: string;
  color: string;
  count: number;
}

interface SigmaGraphProps {
  graph: Graphology;
  typeInfo: TypeInfo[];
}

// Component that loads the graph into Sigma
const LoadGraph: React.FC<{ graph: Graphology }> = ({ graph }) => {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    // The graph is already processed and validated in the main component
    // Just load it into Sigma
    loadGraph(graph);
  }, [loadGraph, graph]);

  return null;
};

// Component for static force-directed layout
const ForceAtlas2Layout: React.FC = () => {
  const { start, stop, kill, isRunning } = useWorkerLayoutForceAtlas2({
    settings: {
      // Static layout settings - very gentle forces
      gravity: 0.0001,          // Very low gravity to keep nodes in place
      scalingRatio: 0.1,        // Minimal scaling to prevent movement
      slowDown: 3.0,            // Slower movement for stability
      strongGravityMode: true,  // Strong gravity to center the graph
      linLogMode: false,        // Linear mode for predictable behavior
      outboundAttractionDistribution: false,
      adjustSizes: false,       // Don't adjust node sizes
      edgeWeightInfluence: 0.1, // Minimal edge influence
      barnesHutOptimize: true,  // Enable optimization
      barnesHutTheta: 0.9,      // Higher theta for better performance
    },
  });

  useEffect(() => {
    // Start the layout briefly to position nodes, then stop to keep them static
    const startTimer = setTimeout(() => {
      start();
    }, 500);

    // Stop the layout after a short time to keep nodes in place
    const stopTimer = setTimeout(() => {
      stop();
    }, 2000); // Run for 2 seconds then stop

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
      kill();
    };
  }, [start, stop, kill]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: 12,
        zIndex: 999,
        minWidth: 200,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
        Static Layout
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: 8 }}>
        <button
          onClick={isRunning ? stop : start}
          style={{
            background: isRunning ? "#f44336" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            flex: 1,
          }}
        >
          {isRunning ? "Stop" : "Reposition"}
        </button>
        <button
          onClick={kill}
          style={{
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            flex: 1,
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#666" }}>
        Status: {isRunning ? "Positioning" : "Static"}
      </div>
    </div>
  );
};

// Component for node type legend
const TypeLegend: React.FC<{ typeInfo: TypeInfo[] }> = ({ typeInfo }) => {
  if (!typeInfo || typeInfo.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "10px",
        maxWidth: 250,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: 12,
        zIndex: 999,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Node Types</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", paddingBottom: 6, fontSize: 11 }}>Type</th>
            <th style={{ textAlign: "center", paddingBottom: 6, fontSize: 11 }}>Color</th>
            <th style={{ textAlign: "right", paddingBottom: 6, fontSize: 11 }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {typeInfo.map((info) => (
            <tr key={info.type}>
              <td style={{ fontWeight: 500, paddingRight: 5, paddingTop: 3, paddingBottom: 3, fontSize: 11 }}>
                {info.type}
              </td>
              <td style={{ textAlign: "center", paddingTop: 3, paddingBottom: 3 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: info.color,
                    display: "inline-block",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </td>
              <td style={{ textAlign: "right", paddingTop: 3, paddingBottom: 3, fontSize: 11 }}>
                {info.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component for graph statistics
const GraphStats: React.FC<{ graph: Graphology }> = ({ graph }) => {
  const stats = useMemo(() => {
    const nodeCount = graph.order;
    const edgeCount = graph.size;
    const avgDegree = edgeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

    return { nodeCount, edgeCount, avgDegree: avgDegree.toFixed(2) };
  }, [graph]);

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: 12,
        zIndex: 999,
        minWidth: 150,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Graph Stats</div>
      <div style={{ fontSize: 11, lineHeight: 1.4 }}>
        <div>Nodes: {stats.nodeCount}</div>
        <div>Edges: {stats.edgeCount}</div>
        <div>Avg Degree: {stats.avgDegree}</div>
      </div>
    </div>
  );
};

// Client-only wrapper component
const ClientOnlySigmaGraph: React.FC<SigmaGraphProps> = ({ graph, typeInfo }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  // State to track if we're on the client side
  const [isClient, setIsClient] = useState(false);

  // Memoize the graph to prevent unnecessary re-renders
  const memoizedGraph = useMemo(() => {
    // Only process graph on client side to avoid hydration issues
    if (!isClient || typeof window === 'undefined') {
      return null;
    }

    try {
      // Validate graph before memoizing
      if (!graph || graph.order === 0) {
        return graph;
      }

      // Create a copy of the graph to avoid modifying the original
      const graphCopy = graph.copy();
      
      // Pre-process the graph to ensure all nodes have valid coordinates
      let hasInvalidCoordinates = false;
      graphCopy.forEachNode((node) => {
        const attrs = graphCopy.getNodeAttributes(node);
        let x = attrs.x;
        let y = attrs.y;
        
        // Check and fix x coordinate
        if (typeof x !== 'number' || isNaN(x) || !isFinite(x)) {
          // Use hash-based deterministic positioning with better bounds
          const hash = node.split('').reduce((a, b) => {
            a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
            return a;
          }, 0);
          // Keep nodes within a reasonable viewport (-200 to 200)
          x = (hash % 400) - 200;
          graphCopy.setNodeAttribute(node, "x", x);
          hasInvalidCoordinates = true;
        }
        
        // Check and fix y coordinate
        if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
          // Use hash-based deterministic positioning with better bounds
          const hash = node.split('').reduce((a, b) => {
            a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
            return a;
          }, 0);
          // Keep nodes within a reasonable viewport (-200 to 200)
          y = ((hash >> 16) % 400) - 200;
          graphCopy.setNodeAttribute(node, "y", y);
          hasInvalidCoordinates = true;
        }
        
        // Ensure other required attributes
        if (!graphCopy.hasNodeAttribute(node, "size")) {
          graphCopy.setNodeAttribute(node, "size", 8);
        }
        
        if (!graphCopy.hasNodeAttribute(node, "label")) {
          graphCopy.setNodeAttribute(node, "label", node);
        }
        
        if (!graphCopy.hasNodeAttribute(node, "color")) {
          graphCopy.setNodeAttribute(node, "color", "#4285F4");
        }
        
        // Ensure all nodes have a valid Sigma-compatible type
        if (!graphCopy.hasNodeAttribute(node, "type")) {
          graphCopy.setNodeAttribute(node, "type", "circle");
        } else {
          // Map all custom types to Sigma-compatible types
          const nodeType = graphCopy.getNodeAttribute(node, "type");
          // Map any non-Sigma-compatible types to "circle"
          if (nodeType !== "circle" && nodeType !== "square" && nodeType !== "diamond" && nodeType !== "cross" && nodeType !== "star") {
            graphCopy.setNodeAttribute(node, "type", "circle");
          }
        }
      });
      
      // Process edges
      graphCopy.forEachEdge((edge) => {
        if (!graphCopy.hasEdgeAttribute(edge, "color")) {
          graphCopy.setEdgeAttribute(edge, "color", "#999");
        }
        if (!graphCopy.hasEdgeAttribute(edge, "size")) {
          graphCopy.setEdgeAttribute(edge, "size", 1);
        }
      });

      if (hasInvalidCoordinates) {
        console.log("Fixed invalid coordinates in graph, proceeding with visualization");
      }
      
      // Log node types for debugging
      const nodeTypes = new Set();
      graphCopy.forEachNode((node) => {
        const nodeType = graphCopy.getNodeAttribute(node, "type");
        nodeTypes.add(nodeType);
      });
      console.log("Node types in graph:", Array.from(nodeTypes));

      setGraphError(null);
      return graphCopy;
    } catch (error) {
      console.error('Error processing graph:', error);
      setGraphError("Failed to process graph structure");
      return null;
    }
  }, [graph, isClient]);

  // Set client flag on mount to avoid hydration issues
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  // Custom settings for Sigma
  const sigmaSettings = useMemo(() => ({
    renderLabels: true,
    labelRenderedSizeThreshold: 8,
    defaultNodeColor: "#4285F4",
    defaultEdgeColor: "#999",
    // Add viewport constraints to prevent nodes from going off-screen
    maxCameraRatio: 10,
    minCameraRatio: 0.1,
    // Better zoom and pan settings
    enableEdgeHovering: true,
    enableNodeHovering: true,
    // Prevent nodes from going too far
    nodeReducer: (node: string, data: any) => ({
      ...data,
      size: data.size || 8,
      color: node === selectedNode ? "#FFD700" : data.color,
      // Ensure all nodes have a valid type for Sigma
      type: (data.type && ["circle", "square", "diamond", "cross", "star"].includes(data.type)) 
        ? data.type 
        : "circle",
    }),
    edgeReducer: (edge: string, data: any) => ({
      ...data,
      size: data.size || 1,
      color: data.color || "#999",
    }),
  }), [selectedNode]);

  // Show error if graph is invalid
  if (graphError) {
    return (
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        border: "1px solid #e0e0e0",
        borderRadius: "8px"
      }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
            Graph Error
          </div>
          <div style={{ fontSize: "14px" }}>{graphError}</div>
          <div style={{ fontSize: "12px", marginTop: "8px", color: "#999" }}>
            Please check the graph data and try again.
          </div>
        </div>
      </div>
    );
  }

  // Don't render SigmaContainer if graph is null
  if (!memoizedGraph) {
    return (
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        border: "1px solid #e0e0e0",
        borderRadius: "8px"
      }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
            Loading Graph...
          </div>
          <div style={{ fontSize: "14px" }}>Preparing graph visualization</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <SigmaContainer 
        style={{ width: "100%", height: "100%" }}
        settings={sigmaSettings}
        graph={memoizedGraph}
      >
        <LoadGraph graph={memoizedGraph} />

        {/* Controls */}
        <ZoomControl />
        <FullScreenControl />
        <ForceAtlas2Layout />

        {/* Info panels */}
        <TypeLegend typeInfo={typeInfo} />
        <GraphStats graph={memoizedGraph} />
      </SigmaContainer>
    </div>
  );
};

// Main SigmaGraph component with client-side check
const SigmaGraph: React.FC<SigmaGraphProps> = (props) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        border: "1px solid #e0e0e0",
        borderRadius: "8px"
      }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
            Loading Graph...
          </div>
          <div style={{ fontSize: "14px" }}>Preparing graph visualization</div>
        </div>
      </div>
    );
  }

  return <ClientOnlySigmaGraph {...props} />;
};

export default SigmaGraph;
