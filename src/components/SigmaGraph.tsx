import React, { useRef, useEffect, useState } from "react";
import Sigma from "sigma";
import Graphology from "graphology";

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


  useEffect(() => {
    if (!containerRef.current || !graph) return;
    if (sigmaInstanceRef.current) {
      sigmaInstanceRef.current.kill();
      sigmaInstanceRef.current = null;
    }

    // Process the graph to ensure all nodes have the required attributes
    graph.forEachNode((node) => {
      // Make sure all nodes have a common type that Sigma can render
      // This fixes the 'could not find a suitable program for node type' error
      graph.setNodeAttribute(node, "type", "circle");
    });

    // Create sigma instance with default renderer
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
      const coordinates = { x: nodeAttrs.x, y: nodeAttrs.y };
      const nodeScreen = sigmaRenderer?.graphToViewport(coordinates) ?? { x: 0, y: 0 };
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
      const graphCoords = sigmaRenderer?.viewportToGraph({ x: adjusted.x, y: adjusted.y }) ?? { x: 0, y: 0 };
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
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      {renderTooltip()}
      {renderTypeInfoBox()}
    </div>
  );
};

export default SigmaGraph;
