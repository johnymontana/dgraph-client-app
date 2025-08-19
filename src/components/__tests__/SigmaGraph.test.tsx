import React from 'react';
import { render, screen } from '@testing-library/react';
import SigmaGraph from '../SigmaGraph';
import Graphology from 'graphology';

// Mock React Sigma components
jest.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children, ...props }: any) => (
    <div data-testid="sigma-container" {...props}>
      {children}
    </div>
  ),
  useLoadGraph: () => jest.fn(),
  useSigma: () => ({
    getCamera: () => ({
      animate: jest.fn(),
    }),
    getGraph: () => ({
      order: 0,
      forEachNode: jest.fn(),
    }),
  }),
  ZoomControl: () => <div data-testid="zoom-control">Zoom Control</div>,
  FullScreenControl: () => <div data-testid="fullscreen-control">Fullscreen Control</div>,
}));

jest.mock('@react-sigma/layout-forceatlas2', () => ({
  useWorkerLayoutForceAtlas2: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    kill: jest.fn(),
    isRunning: false,
  }),
}));

// Mock CSS import
jest.mock('@react-sigma/core/lib/style.css', () => ({}));

describe('SigmaGraph', () => {
  let mockGraph: Graphology;
  let mockTypeInfo: Array<{ type: string; color: string; count: number }>;

  beforeEach(() => {
    // Create a mock graph
    mockGraph = new Graphology();
    mockGraph.addNode('node1', { x: 0, y: 0, label: 'Node 1', color: '#4285F4' });
    mockGraph.addNode('node2', { x: 100, y: 100, label: 'Node 2', color: '#34A853' });
    mockGraph.addEdgeWithKey('edge1', 'node1', 'node2', { label: 'Edge 1' });

    mockTypeInfo = [
      { type: 'Person', color: '#4285F4', count: 1 },
      { type: 'Company', color: '#34A853', count: 1 },
    ];
  });

  it('renders without crashing', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
  });

  it('renders zoom controls', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
  });

  it('renders fullscreen controls', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByTestId('fullscreen-control')).toBeInTheDocument();
  });

  it('renders ForceAtlas2 layout controls', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByText('ForceAtlas2 Layout')).toBeInTheDocument();
  });

  it('renders node type legend', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByText('Node Types')).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  it('renders graph statistics', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByText('Graph Stats')).toBeInTheDocument();
    expect(screen.getByText('Nodes: 2')).toBeInTheDocument();
    expect(screen.getByText('Edges: 1')).toBeInTheDocument();
  });

  it('handles empty type info gracefully', () => {
    render(<SigmaGraph graph={mockGraph} typeInfo={[]} />);
    expect(screen.queryByText('Node Types')).not.toBeInTheDocument();
  });

  it('handles empty graph gracefully', () => {
    const emptyGraph = new Graphology();
    render(<SigmaGraph graph={emptyGraph} typeInfo={mockTypeInfo} />);
    expect(screen.getByText('Graph Stats')).toBeInTheDocument();
    expect(screen.getByText('Nodes: 0')).toBeInTheDocument();
    expect(screen.getByText('Edges: 0')).toBeInTheDocument();
  });

  it('handles graph with invalid coordinates gracefully by fixing them', () => {
    const invalidGraph = new Graphology();
    invalidGraph.addNode('node1', { x: 0, y: 0, label: 'Node 1', color: '#4285F4' });
    invalidGraph.addNode('node2', { x: NaN, y: 'invalid', label: 'Node 2', color: '#34A853' });
    invalidGraph.addEdgeWithKey('edge1', 'node1', 'node2', { label: 'Edge 1' });

    render(<SigmaGraph graph={invalidGraph} typeInfo={mockTypeInfo} />);
    
    // The component should now fix invalid coordinates and render the graph
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    expect(screen.getByText('Graph Stats')).toBeInTheDocument();
    expect(screen.getByText('Nodes: 2')).toBeInTheDocument();
    expect(screen.getByText('Edges: 1')).toBeInTheDocument();
  });

  it('handles graph with problematic node types gracefully by mapping them to valid types', () => {
    const problematicGraph = new Graphology();
    problematicGraph.addNode('node1', { x: 0, y: 0, label: 'Node 1', color: '#4285F4', type: 'Unknown' });
    problematicGraph.addNode('node2', { x: 100, y: 100, label: 'Node 2', color: '#34A853', type: 'predicate' });
    problematicGraph.addNode('node3', { x: 200, y: 200, label: 'Node 3', color: '#EA4335', type: 'scalar' });
    problematicGraph.addNode('node4', { x: 300, y: 300, label: 'Node 4', color: '#FBBC04', type: 'invalid_type' });
    problematicGraph.addEdgeWithKey('edge1', 'node1', 'node2', { label: 'Edge 1' });
    problematicGraph.addEdgeWithKey('edge2', 'node2', 'node3', { label: 'Edge 2' });
    problematicGraph.addEdgeWithKey('edge3', 'node3', 'node4', { label: 'Edge 3' });

    render(<SigmaGraph graph={problematicGraph} typeInfo={mockTypeInfo} />);
    
    // The component should now handle problematic node types and render the graph
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    expect(screen.getByText('Graph Stats')).toBeInTheDocument();
    expect(screen.getByText('Nodes: 4')).toBeInTheDocument();
    expect(screen.getByText('Edges: 3')).toBeInTheDocument();
  });
});
