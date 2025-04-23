'use client';

import React, { useEffect, useRef } from 'react';
import Graph from 'graphology';
// Import Sigma directly from the package
import { Sigma } from 'sigma';

interface GraphVisualizerProps {
  graph: Graph;
  settings?: Record<string, any>;
  onNodeClick?: (event: any, node: string) => void;
  onStageClick?: () => void;
}

export default function GraphVisualizer({
  graph,
  settings,
  onNodeClick,
  onStageClick
}: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);

  // Initialize Sigma when the component mounts
  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // Create a new Sigma instance
    sigmaRef.current = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelSize: 12,
      labelWeight: 'bold',
      defaultNodeColor: '#4285F4',
      defaultEdgeColor: '#999',
      ...settings
    });

    // Add event listeners
    if (onNodeClick && sigmaRef.current) {
      sigmaRef.current.on('clickNode', (event: any) => {
        onNodeClick(event, event.node);
      });
    }

    if (onStageClick && sigmaRef.current) {
      sigmaRef.current.on('clickStage', onStageClick);
    }

    // Cleanup function
    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [graph, settings, onNodeClick, onStageClick]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Sigma will render here */}
      <div className="controls" style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}>
        <button
          onClick={() => sigmaRef.current?.getCamera().animatedZoom({ duration: 600 })}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <button
          onClick={() => sigmaRef.current?.getCamera().animatedUnzoom({ duration: 600 })}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
          title="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <button
          onClick={() => sigmaRef.current?.getCamera().animatedReset({ duration: 600 })}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
          title="Reset view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>
      </div>
    </div>
  );
}
