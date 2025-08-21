'use client';

import React, { useEffect, useRef } from "react";
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from "@react-sigma/core";
import Graphology from "graphology";
import "@react-sigma/core/lib/style.css";
import { random } from 'graphology-layout';
import { useLayoutNoverlap } from '@react-sigma/layout-noverlap';

interface TypeInfo {
  type: string;
  color: string;
  count: number;
}

interface SigmaGraphProps {
  graph: Graphology;
  typeInfo?: TypeInfo[];
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onEdgeClick?: (edgeId: string, edgeData: any) => void;
}

// Simple component that loads the graph into Sigma
const LoadGraph: React.FC<{ graph: Graphology; onNodeClick?: (nodeId: string, nodeData: any) => void; onEdgeClick?: (edgeId: string, edgeData: any) => void }> = ({ graph, onNodeClick, onEdgeClick }) => {
  const loadGraph = useLoadGraph();
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
    if (sigma) {
      console.log('Sigma instance created:', sigma);
      console.log('Sigma container:', sigma.getContainer());
      console.log('Sigma container dimensions:', {
        width: sigma.getContainer()?.clientWidth,
        height: sigma.getContainer()?.clientHeight
      });

      // Force Sigma to resize after a short delay to ensure container is ready
      setTimeout(() => {
        try {
          const container = sigma.getContainer();
          if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            sigma.resize();
            console.log('Sigma resized, new dimensions:', {
              width: container.clientWidth,
              height: container.clientHeight
            });
          } else {
            console.log('Container not ready for resize, dimensions:', {
              width: container?.clientWidth,
              height: container?.clientHeight
            });
          }
        } catch (error) {
          console.warn('Error during Sigma resize:', error);
        }
      }, 200); // Increased delay to ensure container is ready
    }
  }, [sigma]);

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
const SigmaGraph: React.FC<SigmaGraphProps> = ({ graph, onNodeClick, onEdgeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure container has proper dimensions
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const parent = container.parentElement;

      if (parent) {
        const parentHeight = parent.clientHeight;
        const parentWidth = parent.clientWidth;

        console.log('Parent dimensions:', { width: parentWidth, height: parentHeight });
        console.log('Container dimensions before:', { width: container.clientWidth, height: container.clientHeight });

        // Force container to have proper dimensions
        if (parentHeight > 0) {
          container.style.height = `${parentHeight}px`;
          container.style.minHeight = `${parentHeight}px`;
        } else {
          // Fallback to default dimensions if parent height is not available
          container.style.height = '500px';
          container.style.minHeight = '500px';
        }

        if (parentWidth > 0) {
          container.style.width = `${parentWidth}px`;
        }

        console.log('Container dimensions after:', { width: container.clientWidth, height: container.clientHeight });

        // Set up ResizeObserver to handle dynamic height changes
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (height > 0) {
              container.style.height = `${height}px`;
              container.style.minHeight = `${height}px`;
            }
            if (width > 0) {
              container.style.width = `${width}px`;
            }
          }
        });

        resizeObserver.observe(parent);

        return () => {
          resizeObserver.disconnect();
        };
      }
    }
  }, [graph]);

  // Monitor container dimensions and force Sigma to resize
  useEffect(() => {
    const interval = setInterval(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const { width, height } = container.getBoundingClientRect();

        if (height > 0 && height !== 500) {
          console.log('Container dimensions changed, updating styles:', { width, height });
          container.style.height = `${height}px`;
          container.style.minHeight = `${height}px`;
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // Force Sigma to resize when graph changes
  useEffect(() => {
    if (graph && graph.order > 0) {
      // Force a resize after the graph is loaded
      setTimeout(() => {
        if (containerRef.current) {
          const container = containerRef.current;
          const { width, height } = container.getBoundingClientRect();
          console.log('Graph loaded, forcing container resize:', { width, height });

          if (height > 0) {
            container.style.height = `${height}px`;
            container.style.minHeight = `${height}px`;
          }
        }
      }, 200);
    }
  }, [graph]);

  // Force Sigma to resize when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const { width, height } = container.getBoundingClientRect();
        console.log('Component mounted, container dimensions:', { width, height });

        if (height > 0) {
          container.style.height = `${height}px`;
          container.style.minHeight = `${height}px`;
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!graph || graph.order === 0) {
    return (
      <div style={{ 
        width: "100%", 
        height: "100%",
        minHeight: "400px",
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
    allowInvalidContainer: true, // Allow invalid container temporarily to prevent errors
    container: undefined, // Let Sigma handle the container
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
    <div 
      ref={containerRef} 
      className="graph-container" 
      style={{ 
        width: "100%", 
        height: "500px", 
        minHeight: "500px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <SigmaContainer 
        className="sigma-container"
        style={{ 
          width: "100%", 
          height: "100%", 
          minHeight: "500px",
          position: "absolute",
          top: 0,
          left: 0
        }}
        settings={settings}
      >
        <LoadGraph graph={graph} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} />
        {/* <Fa2 /> */}
      </SigmaContainer>
    </div>
  );
};

export default SigmaGraph;