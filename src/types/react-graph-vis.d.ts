declare module 'react-graph-vis' {
  import { Component } from 'react';
  
  export interface GraphData {
    nodes: Array<{
      id: string | number;
      label?: string;
      title?: string;
      color?: string | {
        background?: string;
        border?: string;
        highlight?: string | {
          background?: string;
          border?: string;
        };
        hover?: string | {
          background?: string;
          border?: string;
        };
      };
      [key: string]: any;
    }>;
    edges: Array<{
      id?: string;
      from: string | number;
      to: string | number;
      label?: string;
      title?: string;
      color?: string;
      width?: number;
      [key: string]: any;
    }>;
  }

  export interface GraphEvents {
    [event: string]: (params?: any) => void;
  }

  export interface GraphOptions {
    layout?: any;
    edges?: any;
    nodes?: any;
    physics?: any;
    interaction?: any;
    manipulation?: any;
    height?: string;
    width?: string;
    [key: string]: any;
  }

  export interface NetworkInstance {
    on(event: string, callback: (params?: any) => void): void;
    off(event: string, callback: (params?: any) => void): void;
    destroy(): void;
    setData(data: GraphData): void;
    setOptions(options: GraphOptions): void;
    fit(options?: { animation: boolean }): void;
    redraw(): void;
    getSelection(): { nodes: string[], edges: string[] };
    getSelectedNodes(): string[];
    getSelectedEdges(): string[];
    getNodeAt(position: { x: number, y: number }): string;
    getEdgeAt(position: { x: number, y: number }): string;
    selectNodes(nodeIds: string[], highlightEdges?: boolean): void;
    selectEdges(edgeIds: string[]): void;
    unselectAll(): void;
    getScale(): number;
    getViewPosition(): { x: number, y: number };
    moveTo(options: { position: { x: number, y: number }, scale?: number, animation?: boolean }): void;
    focus(nodeId: string, options?: { scale?: number, animation?: boolean }): void;
    releaseNode(): void;
    getPositions(nodeIds?: string[]): { [nodeId: string]: { x: number, y: number } };
    storePositions(): void;
    moveNode(nodeId: string, x: number, y: number): void;
    [key: string]: any;
  }

  export interface GraphProps {
    graph: GraphData;
    options?: GraphOptions;
    events?: GraphEvents;
    style?: React.CSSProperties;
    getNetwork?: (network: NetworkInstance) => void;
    getNodes?: (nodes: any) => void;
    getEdges?: (edges: any) => void;
  }

  export default class Graph extends Component<GraphProps> {
    network: NetworkInstance;
    nodes: any;
    edges: any;
  }
}
