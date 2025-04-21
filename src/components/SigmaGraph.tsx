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
    });

    // Handlers for tooltips
    const renderer = sigmaInstanceRef.current;
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
    renderer.on("enterNode", handleEnterNode);
    renderer.on("leaveNode", handleLeaveNode);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      renderer.off("enterNode", handleEnterNode);
      renderer.off("leaveNode", handleLeaveNode);
      window.removeEventListener("mousemove", handleMouseMove);
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
    };
  }, [graph]);

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
