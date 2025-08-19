import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SchemaVisualization from '../SchemaVisualization';

// Mock the SigmaGraph component
jest.mock('../SigmaGraph', () => {
  return function MockSigmaGraph({ onNodeClick }: any) {
    return (
      <div data-testid="sigma-graph">
        <button
          data-testid="mock-node-person"
          onClick={() => onNodeClick('Person', {
            label: 'Person',
            type: 'type',
            color: '#EA4335',
            size: 12
          })}
        >
          Person Node
        </button>
        <button
          data-testid="mock-node-movie"
          onClick={() => onNodeClick('Movie', {
            label: 'Movie',
            type: 'type',
            color: '#EA4335',
            size: 12
          })}
        >
          Movie Node
        </button>
      </div>
    );
  };
});

describe('SchemaVisualization', () => {
  const mockSchemaText = `
    type Person {
      name: string
      age: int
      friends: [uid]
    }
    
    type Movie {
      title: string
      year: int
      director: uid
    }
  `;

  beforeEach(() => {
    // Clear any previous state
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SchemaVisualization schemaText={mockSchemaText} />);
    expect(screen.getByText('Schema Visualization')).toBeInTheDocument();
  });

  it('shows graph view by default', () => {
    render(<SchemaVisualization schemaText={mockSchemaText} />);
    expect(screen.getByTestId('sigma-graph')).toBeInTheDocument();
  });

  it('can switch to JSON view', () => {
    render(<SchemaVisualization schemaText={mockSchemaText} />);
    
    const jsonButton = screen.getByText('JSON View');
    fireEvent.click(jsonButton);
    
    // Should show JSON view content
    expect(screen.getByText('JSON View')).toHaveClass('bg-indigo-600');
  });

  it('shows property display when a node is clicked', () => {
    render(<SchemaVisualization schemaText={mockSchemaText} />);
    
    // Click on a mock node
    const personNode = screen.getByTestId('mock-node-person');
    fireEvent.click(personNode);
    
    // Should show the property display panel
    expect(screen.getByText('🔵 Person Type')).toBeInTheDocument();
    expect(screen.getByText('Type Details:')).toBeInTheDocument();
  });

  it('can close the property display panel', () => {
    render(<SchemaVisualization schemaText={mockSchemaText} />);
    
    // Click on a mock node to open panel
    const personNode = screen.getByTestId('mock-node-person');
    fireEvent.click(personNode);
    
    // Verify panel is open
    expect(screen.getByText('🔵 Person Type')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    // Panel should be closed
    expect(screen.queryByText('🔵 Person Type')).not.toBeInTheDocument();
  });

  it('shows legend with click instructions', () => {
    render(<SchemaVisualization schemaText={mockSchemaText} />);
    
    expect(screen.getByText(/Click on any type node \(red\) to see its predicates and properties/)).toBeInTheDocument();
  });

  it('handles empty schema gracefully', () => {
    render(<SchemaVisualization schemaText="" />);
    
    // Should show error message about no schema
    expect(screen.getByText(/No schema defined - showing example schema visualization/)).toBeInTheDocument();
    
    // Should still show the graph view
    expect(screen.getByTestId('sigma-graph')).toBeInTheDocument();
  });
});
