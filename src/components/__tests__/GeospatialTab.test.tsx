import React from 'react';
import { render, screen } from '@testing-library/react';
import GeospatialTab from '../GeospatialTab';
import { DgraphProvider } from '@/context/DgraphContext';

// Mock maplibre-gl
jest.mock('maplibre-gl', () => ({
  Map: jest.fn().mockImplementation(() => ({
    addControl: jest.fn(),
    remove: jest.fn(),
    getSource: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
  })),
  NavigationControl: jest.fn(),
}));

// Mock @mapbox/mapbox-gl-draw
jest.mock('@mapbox/mapbox-gl-draw', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    deleteAll: jest.fn(),
  }));
});

describe('GeospatialTab', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <DgraphProvider>
        {component}
      </DgraphProvider>
    );
  };

  it('renders without crashing', () => {
    renderWithProvider(<GeospatialTab />);
    expect(screen.getByText('Geospatial Analysis')).toBeInTheDocument();
  });

  it('shows connection warning when not connected', () => {
    renderWithProvider(<GeospatialTab />);
    expect(screen.getByText('Not Connected')).toBeInTheDocument();
    expect(screen.getByText('Please connect to a Dgraph database to use geospatial features.')).toBeInTheDocument();
  });

  it('renders map and dashboard sections', () => {
    renderWithProvider(<GeospatialTab />);
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    expect(screen.getByText('Query Dashboard')).toBeInTheDocument();
  });

  it('shows drawing controls', () => {
    renderWithProvider(<GeospatialTab />);
    expect(screen.getByText('Polygon')).toBeInTheDocument();
    expect(screen.getByText('Point')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});
