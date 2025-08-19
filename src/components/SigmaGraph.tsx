'use client';

import React, { useEffect } from "react";
import { SigmaContainer, useLoadGraph, useSetSettings, useRegisterEvents, useSigma } from "@react-sigma/core";
import Graphology from "graphology";
import "@react-sigma/core/lib/style.css";
import { random } from 'graphology-layout';
import { useWorkerLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import { useLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import { useLayoutNoverlap } from '@react-sigma/layout-noverlap';
import { useLayoutForce } from '@react-sigma/layout-force';

interface TypeInfo {
  type: string;
  color: string;
  count: number;
}

interface SigmaGraphProps {
  graph: Graphology;
  typeInfo: TypeInfo[];
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onEdgeClick?: (edgeId: string, edgeData: any) => void;
}

// Simple component that loads the graph into Sigma
const LoadGraph: React.FC<{ graph: Graphology; onNodeClick?: (nodeId: string, nodeData: any) => void; onEdgeClick?: (edgeId: string, edgeData: any) => void }> = ({ graph, onNodeClick, onEdgeClick }) => {
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  // const {positions, assign} = useLayoutForceAtlas2();
  const {assign} = useLayoutNoverlap();
  //const {assign} = useLayoutForce();

  useEffect(() => {
    if (graph && graph.order > 0) {
      console.log('Loading graph with', graph.order, 'nodes and', graph.size, 'edges');
      
      // Apply circular layout
      random.assign(graph);
      
      // Load the graph
      loadGraph(graph);

      assign();
    }
  }, [assign, loadGraph, graph]);

  useEffect(() => {
    if (onNodeClick || onEdgeClick) {
      registerEvents({
        clickNode: (event) => {
          try {
            const graph = sigma.getGraph();
            if (graph && graph.hasNode(event.node)) {
              const nodeAttributes = graph.getNodeAttributes(event.node);
              onNodeClick?.(event.node, nodeAttributes);
            }
          } catch (error) {
            console.error('Error handling node click:', error);
          }
        },
        clickEdge: (event) => {
          try {
            const graph = sigma.getGraph();
            if (graph && graph.hasEdge(event.edge)) {
              const edgeAttributes = graph.getEdgeAttributes(event.edge);
              onEdgeClick?.(event.edge, edgeAttributes);
            }
          } catch (error) {
            console.error('Error handling edge click:', error);
          }
        },
        clickStage: () => {
          // Optional: handle stage click to deselect
        }
      });
    }
  }, [registerEvents, onNodeClick, onEdgeClick, sigma]);

  return null;
};

// Main SigmaGraph component
const SigmaGraph: React.FC<SigmaGraphProps> = ({ graph, typeInfo, onNodeClick, onEdgeClick }) => {
  if (!graph || graph.order === 0) {
    return (
      <div style={{ 
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
          <div>No graph data available</div>
        </div>
      </div>
    );
  }

  const settings = {
    renderLabels: true,
    renderEdgeLabels: true,
    defaultNodeColor: "#4285F4",
    defaultEdgeColor: "#ccc",
    labelRenderedSizeThreshold: 8,
    edgeLabelRenderedSizeThreshold: 0, // Always show edge labels
    nodeReducer: (node: string, data: any) => ({
      ...data,
      type: "circle", // Force all nodes to use circle type
      size: data.size || 8,
      color: data.color || "#4285F4",
    }),
    edgeReducer: (edge: string, data: any) => ({
      ...data,
      type: data.type || "line", // Default to line if no type specified
      color: data.color || "#ccc",
      size: data.size || 1,
      label: data.label || "", // Ensure edge label is passed through
    }),
  };

  // const Fa2: React.FC = () => {
  //   const { start, kill } = useWorkerLayoutForceAtlas2({ settings: { slowDown: 10 } });
  //
  //   useEffect(() => {
  //     // start FA2
  //     start();
  //
  //     // Kill FA2 on unmount
  //     return () => {
  //       kill();
  //     };
  //   }, [start, kill]);
  //
  //   return null;
  // };

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <SigmaContainer 
        style={{ width: "100%", height: "100%" }}
        settings={settings}
      >
        <LoadGraph graph={graph} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} />
        {/* <Fa2 /> */}
      </SigmaContainer>
    </div>
  );
};

export default SigmaGraph;