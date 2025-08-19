'use client';

import React, { useEffect, useState, useMemo } from "react";
import { SigmaContainer, useLoadGraph, useSigma } from "@react-sigma/core";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { ZoomControl, FullScreenControl } from "@react-sigma/core";
import Graphology from "graphology";
import "@react-sigma/core/lib/style.css";

import { circular } from 'graphology-layout';

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
    loadGraph(graph);
  }, [loadGraph, graph]);

  return null;
};

// Component for ForceAtlas2 layout with view controls
const ForceAtlas2Layout: React.FC = () => {
  const sigma = useSigma();
  const [isRunning, setIsRunning] = useState(false);
  const [isViewFitted, setIsViewFitted] = useState(false);
  
  // Use the ForceAtlas2 layout hook with more conservative settings
  // const { start, stop, kill, isRunning: layoutRunning } = useWorkerLayoutForceAtlas2({
  //   settings: {
  //     // More conservative settings to prevent nodes from flying away
  //     gravity: 1,                // Increased gravity to pull nodes toward center
  //     scalingRatio: 2,          // Increased scaling to reduce node repulsion
  //     slowDown: 10,             // Much higher slowdown for stability
  //     strongGravityMode: true,   // Strong gravity mode for better centering
  //     linLogMode: false,         
  //     outboundAttractionDistribution: false,
  //     adjustSizes: false,        
  //     edgeWeightInfluence: 1,    // Higher edge influence for stability
  //     barnesHutOptimize: true,   
  //     barnesHutTheta: 1.2,      // Higher theta for more stable approximation
  //   },
  // });

  // Function to fit all nodes to view with proper bounds checking
  // const fitNodesToView = () => {
  //   console.log("Fitting nodes to view");
  //   try {
  //     const graph = sigma.getGraph();
  //     if (graph.order === 0) return;

  //     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  //     let validNodeCount = 0;

  //     graph.forEachNode((node) => {
  //       const attrs = graph.getNodeAttributes(node);
  //       if (attrs.x !== undefined && attrs.y !== undefined && 
  //           isFinite(attrs.x) && isFinite(attrs.y)) {
  //         minX = Math.min(minX, attrs.x);
  //         minY = Math.min(minY, attrs.y);
  //         maxX = Math.max(maxX, attrs.x);
  //         maxY = Math.max(maxY, attrs.y);
  //         validNodeCount++;
  //       }
  //     });
      
  //     if (validNodeCount > 0 && minX !== Infinity && maxX !== -Infinity) {
  //       const centerX = (minX + maxX) / 2;
  //       const centerY = (minY + maxY) / 2;
  //       const rangeX = maxX - minX;
  //       const rangeY = maxY - minY;
  //       const maxRange = Math.max(rangeX, rangeY);
        
  //       // Calculate appropriate zoom ratio with padding
  //       const padding = 100;
  //       const containerSize = 600; // Approximate container size
  //       const ratio = maxRange > 0 ? Math.min(1, (containerSize - padding) / maxRange) : 1;
        
  //       console.log(`Fitting view: center(${centerX.toFixed(2)}, ${centerY.toFixed(2)}), ratio: ${ratio.toFixed(3)}`);
        
  //       sigma.getCamera().animate({ 
  //         ratio: Math.max(0.1, Math.min(2, ratio)), // Clamp ratio to reasonable bounds
  //         x: centerX, 
  //         y: centerY 
  //       }, { 
  //         duration: 1000 
  //       });
  //       setIsViewFitted(true);
  //     }
  //   } catch (error) {
  //     console.error('Error fitting nodes to view:', error);
  //   }
  // };

  // Function to reset positions to center if nodes drift too far
  // const resetNodePositions = () => {
  //   console.log("Resetting node positions to center");
  //   try {
  //     const graph = sigma.getGraph();
  //     const nodeCount = graph.order;
      
  //     if (nodeCount === 0) return;

  //     // Reset nodes to a tight circular layout
  //     const radius = Math.min(50, nodeCount * 2); // Smaller radius
      
  //     graph.forEachNode((node, index) => {
  //       const angle = (index * 2 * Math.PI) / nodeCount;
  //       const x = Math.cos(angle) * radius;
  //       const y = Math.sin(angle) * radius;
        
  //       graph.setNodeAttribute(node, "x", x);
  //       graph.setNodeAttribute(node, "y", y);
  //     });

  //     // Refresh the sigma instance
  //     sigma.refresh();
      
  //     // Fit view after reset
  //     setTimeout(() => {
  //       fitNodesToView();
  //     }, 100);
      
  //   } catch (error) {
  //     console.error('Error resetting node positions:', error);
  //   }
  // };

  // // Function to start/stop layout
  // const toggleLayout = () => {
  //   if (layoutRunning) {
  //     stop();
  //     setIsRunning(false);
  //   } else {
  //     // Before starting, ensure nodes are in reasonable positions
  //     resetNodePositions();
  //     setTimeout(() => {
  //       start();
  //       setIsRunning(true);
  //     }, 200);
  //   }
  // };

  // // Function to reset layout and fit view
  // const resetAndFit = () => {
  //   kill(); // Stop current layout
  //   setIsRunning(false);
    
  //   // Reset node positions first
  //   resetNodePositions();
  // };

  // // Monitor node positions and reset if they drift too far
  // useEffect(() => {
  //   if (!layoutRunning) return;

  //   const checkPositions = () => {
  //     try {
  //       const graph = sigma.getGraph();
  //       let maxDistance = 0;
        
  //       graph.forEachNode((node) => {
  //         const attrs = graph.getNodeAttributes(node);
  //         if (attrs.x !== undefined && attrs.y !== undefined) {
  //           const distance = Math.sqrt(attrs.x * attrs.x + attrs.y * attrs.y);
  //           maxDistance = Math.max(maxDistance, distance);
  //         }
  //       });

  //       // If nodes have drifted too far from center (beyond 500 units), reset
  //       if (maxDistance > 500) {
  //         console.log(`Nodes drifted too far (${maxDistance.toFixed(2)}), resetting positions`);
  //         stop();
  //         setIsRunning(false);
  //         resetNodePositions();
  //       }
  //     } catch (error) {
  //       console.error('Error checking node positions:', error);
  //     }
  //   };

  //   const interval = setInterval(checkPositions, 2000); // Check every 2 seconds
  //   return () => clearInterval(interval);
  // }, [layoutRunning, stop]);

  // Auto-fit view on mount and when layout stops
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fitNodesToView();
  //   }, 500);
    
  //   return () => clearTimeout(timer);
  // }, []);

  // // Fit view when layout stops
  // useEffect(() => {
  //   if (!layoutRunning && isRunning) {
  //     // Layout just stopped
  //     setTimeout(() => {
  //       fitNodesToView();
  //     }, 300);
  //   }
  // }, [layoutRunning, isRunning]);

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
        ForceAtlas2 Layout
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: 8, flexDirection: "column" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => {console.log("FIXME: Button stop / Start clicked")}}
            style={{
              background: "#4caf50",
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
            { "FIXME: Button stop / Start"}
          </button>
          <button
            onClick={() => {console.log("FIXME: Button fitNodesToView clicked")}}
            style={{
              background: "#2196F3",
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
            Fit View
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => {console.log("FIXME: Button resetAndFit clicked")}}
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
            Reset & Fit
          </button>
          <button
            onClick={() => {console.log("FIXME: Button resetNodePositions clicked")}}
            style={{
              background: "#9c27b0",
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
            Center Nodes
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#666" }}>
        {/* Status: {layoutRunning ? "Running" : "Stopped"} | {isViewFitted ? "View Fitted" : "Manual View"} */}
        Status here
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
 

  // Set client flag on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("Setting client flag");
      setIsClient(true);
    }
  }, []);

  // Custom settings for Sigma with better bounds
  const sigmaSettings = useMemo(() => ({
    renderLabels: true,
    labelRenderedSizeThreshold: 6,
    defaultNodeColor: "#4285F4",
    defaultEdgeColor: "#999",
    // Stricter viewport constraints
    maxCameraRatio: 5,    // Reduced max zoom out
    minCameraRatio: 0.2,  // Increased min zoom in
    enableEdgeHovering: true,
    enableNodeHovering: true,
    allowInvalidContainer: true,
    nodeReducer: (node: string, data: any) => ({
      ...data,
      size: data.size || 6,
      color: node === selectedNode ? "#FFD700" : data.color,
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

  circular.assign(graph);

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


  return (
    <div 
      style={{ 
        position: "relative", 
        width: "100%", 
        height: "600px",
        minWidth: "400px",
        minHeight: "400px"
      }}
    >
      <SigmaContainer 
        style={{ 
          width: "100%", 
          height: "100%",
          minWidth: "400px",
          minHeight: "400px"
        }}
        settings={sigmaSettings}
        graph={graph}
      >
        <LoadGraph graph={graph} />

        <ZoomControl />
        <FullScreenControl />
        {/* <ForceAtlas2Layout /> */}

        <TypeLegend typeInfo={typeInfo} />
        <GraphStats graph={graph} />
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