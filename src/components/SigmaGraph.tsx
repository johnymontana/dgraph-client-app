'use client';

import React, { useRef, useEffect, useState, useCallback } from "react";
import Sigma from "sigma";
import Graphology from "graphology";
import forceAtlas2, { inferSettings } from "graphology-layout-forceatlas2";
import noverlap from 'graphology-layout-noverlap';
import { debounce } from "lodash";

interface TypeInfo {
  type: string;
  color: string;
  count: number;
}

interface SigmaGraphProps {
  graph: Graphology;
  typeInfo: TypeInfo[];
}

const SigmaGraph: React.FC<SigmaGraphProps> = ({ graph, typeInfo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaInstanceRef = useRef<Sigma | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [showSimulationControls, setShowSimulationControls] = useState(true);
  const [simulationSettings, setSimulationSettings] = useState({
    gravity: 0.05,
    scalingRatio: 2,
    slowDown: 2.5,
    strongGravityMode: false,
    linLogMode: false,
    outboundAttractionDistribution: false,
    adjustSizes: true,
    edgeWeightInfluence: 1,
    barnesHutOptimize: false,
    barnesHutTheta: 0.5,
  });

  const animationFrameRef = useRef<number | null>(null);
  const settingsRef = useRef(simulationSettings);

  // Update the ref whenever simulationSettings changes
  useEffect(() => {
    settingsRef.current = simulationSettings;
  }, [simulationSettings]);

  // Function to run Noverlap layout
  const runNoverlapLayout = useCallback(() => {
    if (!graph || !sigmaInstanceRef.current) return;

    // Optionally, pause ForceAtlas2 simulation
    // const currentRunningState = isSimulationRunning;
    // if (currentRunningState) setIsSimulationRunning(false);

    console.log("Running Noverlap layout...");
    noverlap.assign(graph, {
      maxIterations: 50,
      settings: {
        margin: 5, // Margin between nodes, ensure this is compatible with node sizes
        ratio: 1.2,
        speed: 0.1,
        gridSize: 20, // gridSize can impact performance and quality
      }
    });

    sigmaInstanceRef.current.refresh();
    console.log("Noverlap layout applied and graph refreshed.");

    // Optionally, resume ForceAtlas2 simulation
    // if (currentRunningState) setIsSimulationRunning(true);
  }, [graph, sigmaInstanceRef]);

  // Update simulation settings
  const updateSimulationSettings = useCallback((settings: Partial<typeof simulationSettings>) => {
    setSimulationSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Function to apply inferred settings
  const applyInferredSettings = useCallback(() => {
    if (!graph) return;
    const inferred = inferSettings(graph);
    console.log("Inferred ForceAtlas2 Settings:", inferred);
    // Merge inferred settings with current settings, giving preference to inferred ones
    // Exclude barnesHut related properties if they are not part of what inferSettings provides
    // to avoid them being overridden to undefined if not present in `inferred`.
    const { barnesHutOptimize, barnesHutTheta, ...relevantInferred } = inferred as any;

    const newSettings = {
      ...settingsRef.current,
      ...relevantInferred, 
      // Explicitly keep UI-controlled barnesHut settings unless inferSettings starts providing them
      barnesHutOptimize: simulationSettings.barnesHutOptimize, 
      barnesHutTheta: simulationSettings.barnesHutTheta,
    };
    updateSimulationSettings(newSettings);
  }, [graph, updateSimulationSettings, simulationSettings.barnesHutOptimize, simulationSettings.barnesHutTheta]);

  // Toggle simulation on/off
  const toggleSimulation = useCallback(() => {
    setIsSimulationRunning(prev => !prev);
  }, []);

  // Toggle visibility of simulation controls
  const toggleSimulationControls = useCallback(() => {
    setShowSimulationControls(prev => !prev);
  }, []);

  // Debounced version of the update function
  const debouncedUpdateSettings = useCallback(
    debounce((settings: Partial<typeof simulationSettings>) => {
      updateSimulationSettings(settings);
    }, 200),
    [updateSimulationSettings]
  );

  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // Clean up previous instances
    if (sigmaInstanceRef.current) {
      sigmaInstanceRef.current.kill();
      sigmaInstanceRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Process the graph to ensure all nodes have the required attributes
    graph.forEachNode((node) => {
      // Make sure all nodes have a common type that Sigma can render
      graph.setNodeAttribute(node, "type", "circle");
      // Ensure all nodes have numeric x and y coordinates
      const attrs = graph.getNodeAttributes(node);
      if (typeof attrs.x !== 'number' || isNaN(attrs.x) || typeof attrs.y !== 'number' || isNaN(attrs.y)) {
        graph.setNodeAttribute(node, "x", Math.random() * 10 - 5);
        graph.setNodeAttribute(node, "y", Math.random() * 10 - 5);
      }

      // Add mass attribute based on node connections for more realistic physics
      const nodeConnections = graph.degree(node);
      const mass = Math.max(1, Math.sqrt(nodeConnections + 1));
      graph.setNodeAttribute(node, "mass", mass);

      // Ensure 'size' attribute is set for noverlap and other layouts
      if (!graph.hasNodeAttribute(node, "size")) {
        graph.setNodeAttribute(node, "size", 16); // Default size
      }
    });

    // Create sigma instance with default renderer
    sigmaInstanceRef.current = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelRenderedSizeThreshold: 6,
      defaultNodeColor: "#4285F4",
      defaultEdgeColor: "#999",
      nodeReducer: (node, data) => ({
        ...data,
        size: 16,
        color: node === selectedNode ? "#FFD700" : data.color // Highlight selected node
      })
    });

    // Custom node dragging logic
    let draggingNode: string | null = null;
    let dragOffset: { x: number; y: number } | null = null;

    const sigmaRenderer = sigmaInstanceRef.current;

    const getMouseCoords = (event: MouseEvent) => {
      if (!sigmaRenderer) return { x: 0, y: 0 };
      const rect = (sigmaRenderer.getContainer() as HTMLElement).getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const handleDownNode = (event: any) => {
      draggingNode = event.node;
      setSelectedNode(event.node);
      // Calculate offset between mouse and node center
      const nodeAttrs = graph.getNodeAttributes(event.node);
      const coordinates = { x: nodeAttrs.x, y: nodeAttrs.y };
      const nodeScreen = sigmaRenderer?.graphToViewport(coordinates) ?? { x: 0, y: 0 };
      const mouse = getMouseCoords(event.event);
      dragOffset = {
        x: mouse.x - nodeScreen.x,
        y: mouse.y - nodeScreen.y
      };
    };

    const handleMouseMoveDrag = (event: MouseEvent) => {
      if (!draggingNode) return;
      const mouse = getMouseCoords(event);
      // Adjust mouse position by dragOffset, then convert to graph coordinates
      const adjusted = {
        x: mouse.x - (dragOffset?.x ?? 0),
        y: mouse.y - (dragOffset?.y ?? 0)
      };
      const graphCoords = sigmaRenderer?.viewportToGraph({ x: adjusted.x, y: adjusted.y }) ?? { x: 0, y: 0 };
      graph.mergeNodeAttributes(draggingNode, {
        x: graphCoords.x,
        y: graphCoords.y
      });
      sigmaRenderer?.refresh();
    };

    const handleMouseUp = () => {
      draggingNode = null;
      dragOffset = null;
    };

    sigmaRenderer?.on("downNode", handleDownNode);
    window.addEventListener("mousemove", handleMouseMoveDrag);
    window.addEventListener("mouseup", handleMouseUp);

    // Handlers for tooltips and selection
    const handleEnterNode = (event: any) => {
      const nodeKey = event.node;
      const nodeAttrs = graph.getNodeAttributes(nodeKey);
      setHoveredNode(nodeAttrs);
    };
    const handleLeaveNode = () => {
      setHoveredNode(null);
    };
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    const handleClickNode = (event: any) => {
      setSelectedNode(event.node);
    };
    sigmaRenderer.on("enterNode", handleEnterNode);
    sigmaRenderer.on("leaveNode", handleLeaveNode);
    sigmaRenderer.on("clickNode", handleClickNode);
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop for physics simulation
    const runPhysicsStep = () => {
      if (isSimulationRunning && sigmaRenderer) {
        forceAtlas2.assign(graph, {
          iterations: 1,
          settings: {
            ...settingsRef.current,
            barnesHutOptimize: settingsRef.current.barnesHutOptimize,
            barnesHutTheta: settingsRef.current.barnesHutTheta,
          }
        });
        sigmaRenderer.refresh();
      }
      animationFrameRef.current = requestAnimationFrame(runPhysicsStep);
    };

    // Start animation
    runPhysicsStep();

    return () => {
      // Clean up all event listeners and references
      sigmaRenderer?.off("enterNode", handleEnterNode);
      sigmaRenderer?.off("leaveNode", handleLeaveNode);
      sigmaRenderer?.off("clickNode", handleClickNode);
      sigmaRenderer?.off("downNode", handleDownNode);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mouseup", handleMouseUp);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
    };
  }, [graph, selectedNode, isSimulationRunning]);

  // Tooltip rendering
  const renderTooltip = () => {
    if (!hoveredNode || !mousePosition) return null;
    const properties = hoveredNode.raw || hoveredNode;
    return (
      <div
        style={{
          position: "fixed",
          top: mousePosition.y + 10,
          left: mousePosition.x + 10,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          pointerEvents: "none",
          zIndex: 9999,
          maxWidth: 320,
          fontSize: 13,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{hoveredNode.label}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {Object.entries(properties).map(([key, value]) => (
              <tr key={key}>
                <td style={{ color: "#ccc", paddingRight: 8, verticalAlign: "top" }}>{key}</td>
                <td style={{ color: "#fff", wordBreak: "break-all" }}>{JSON.stringify(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render simulation controls
  const renderSimulationControls = () => {
    if (!showSimulationControls) {
      return (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "rgba(255,255,255,0.85)",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            padding: "5px 8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: 12,
            zIndex: 999,
            cursor: "pointer"
          }}
          onClick={toggleSimulationControls}
        >
          <span style={{ fontWeight: 600 }}>Show Physics Controls</span>
        </div>
      );
    }
    return (
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(255,255,255,0.85)",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          padding: "10px",
          maxWidth: 300,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: 12,
          zIndex: 999
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Physics Simulation</span>
          <div style={{ display: "flex", gap: "5px" }}>
            <button
              onClick={toggleSimulation}
              style={{
                background: isSimulationRunning ? "#f44336" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600
              }}
            >
              {isSimulationRunning ? "Pause" : "Play"}
            </button>
            <button
              onClick={toggleSimulationControls}
              style={{
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600
              }}
            >
              Hide
            </button>
          </div>
        </div>

        <button
          onClick={applyInferredSettings}
          style={{
            background: "#ff9800", // Orange color for distinction
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            marginTop: 8, // Add some space above this button
            width: "100%", // Make button full width
          }}
        >
          Auto-tune Settings
        </button>

        <button
          onClick={runNoverlapLayout}
          style={{
            background: "#4CAF50", // Green color for declutter
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            marginTop: 8,
            width: "100%",
          }}
        >
          Declutter Nodes
        </button>

        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Gravity: {simulationSettings.gravity.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.01"
            value={simulationSettings.gravity}
            onChange={(e) => debouncedUpdateSettings({ gravity: parseFloat(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Scaling Ratio: {simulationSettings.scalingRatio.toFixed(1)}</label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={simulationSettings.scalingRatio}
            onChange={(e) => debouncedUpdateSettings({ scalingRatio: parseFloat(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Slow Down: {simulationSettings.slowDown.toFixed(1)}</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={simulationSettings.slowDown}
            onChange={(e) => debouncedUpdateSettings({ slowDown: parseFloat(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "flex", alignItems: "center", userSelect: "none", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={simulationSettings.linLogMode}
              onChange={() => debouncedUpdateSettings({ linLogMode: !simulationSettings.linLogMode })}
              style={{ marginRight: 4 }}
            />
            <span>LinLog Mode</span>
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "flex", alignItems: "center", userSelect: "none", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={simulationSettings.strongGravityMode}
              onChange={() => debouncedUpdateSettings({ strongGravityMode: !simulationSettings.strongGravityMode })}
              style={{ marginRight: 4 }}
            />
            <span>Strong Gravity</span>
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "flex", alignItems: "center", userSelect: "none", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={simulationSettings.barnesHutOptimize}
              onChange={() => debouncedUpdateSettings({ barnesHutOptimize: !simulationSettings.barnesHutOptimize })}
              style={{ marginRight: 4 }}
            />
            <span>Barnes-Hut Optimization</span>
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Barnes-Hut Theta: {simulationSettings.barnesHutTheta.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={simulationSettings.barnesHutTheta}
            onChange={(e) => debouncedUpdateSettings({ barnesHutTheta: parseFloat(e.target.value) })}
            disabled={!simulationSettings.barnesHutOptimize}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  // Render type info legend box
  const renderTypeInfoBox = () => {
    if (!typeInfo || typeInfo.length === 0) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(255,255,255,0.85)",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          padding: "10px",
          maxWidth: 250,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: 12,
          zIndex: 999
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Node Types</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", paddingBottom: 6 }}>Type</th>
              <th style={{ textAlign: "center", paddingBottom: 6 }}>Color</th>
              <th style={{ textAlign: "right", paddingBottom: 6 }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {typeInfo.map((info) => (
              <tr key={info.type}>
                <td style={{ fontWeight: 500, paddingRight: 5, paddingTop: 3, paddingBottom: 3 }}>
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
                      border: "1px solid rgba(0,0,0,0.1)"
                    }}
                  />
                </td>
                <td style={{ textAlign: "right", paddingTop: 3, paddingBottom: 3 }}>
                  {info.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {renderTooltip()}
      {renderTypeInfoBox()}
      {renderSimulationControls()}
    </div>
  );
};

export default SigmaGraph;
