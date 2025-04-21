import React, { useRef, useEffect, useState } from "react";
import Sigma from "sigma";
import Graphology from "graphology";

interface SigmaGraphProps {
  graph: Graphology;
}

const SigmaGraph: React.FC<SigmaGraphProps> = ({ graph }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaInstanceRef = useRef<Sigma | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);


  useEffect(() => {
    if (!containerRef.current || !graph) return;
    if (sigmaInstanceRef.current) {
      sigmaInstanceRef.current.kill();
      sigmaInstanceRef.current = null;
    }
    sigmaInstanceRef.current = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelRenderedSizeThreshold: 6,
      defaultNodeColor: '#4285F4',
      defaultEdgeColor: '#999',
      nodeReducer: (node, data) => ({
        ...data,
        size: 16,
        color: node === selectedNode ? '#FFD700' : data.color // Highlight selected node
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
      // Convert node's graph coordinates to viewport (screen) coordinates
      const nodeScreen = sigmaRenderer?.graphToViewport?.(nodeAttrs.x, nodeAttrs.y) ?? { x: 0, y: 0 };
      const mouse = getMouseCoords(event.event);
      dragOffset = {
        x: mouse.x - nodeScreen.x,
        y: mouse.y - nodeScreen.y
      };
      // Prevent default to avoid unwanted text selection
      //event.preventDefault();
    };

    const handleMouseMoveDrag = (event: MouseEvent) => {
      if (!draggingNode) return;
      const mouse = getMouseCoords(event);
      // Adjust mouse position by dragOffset, then convert to graph coordinates
      const adjusted = {
        x: mouse.x - (dragOffset?.x ?? 0),
        y: mouse.y - (dragOffset?.y ?? 0)
      };
      const graphCoords = sigmaRenderer?.viewportToGraph?.(adjusted.x, adjusted.y) ?? { x: 0, y: 0 };
      graph.mergeNodeAttributes(draggingNode, {
        x: graphCoords.x,
        y: graphCoords.y
      });
      sigmaRenderer?.refresh?.();
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

    return () => {
      sigmaRenderer?.off("enterNode", handleEnterNode);
      sigmaRenderer?.off("leaveNode", handleLeaveNode);
      sigmaRenderer?.off("clickNode", handleClickNode);
      sigmaRenderer?.off("downNode", handleDownNode);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mouseup", handleMouseUp);
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
    };
  }, [graph, selectedNode]);

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

  return (
    <>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      {renderTooltip()}
    </>
  );
};

export default SigmaGraph;
