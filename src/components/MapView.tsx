'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define type for node data
interface GeoNode {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  raw: any;
  type?: string;
}

interface MapViewProps {
  nodes: GeoNode[];
  edges: Array<{
    source: string;
    target: string;
    label: string;
  }>;
  onNodeClick?: (node: GeoNode) => void;
  height?: string;
}

// Helper component to fit the map bounds to the markers
function FitBounds({ nodes }: { nodes: GeoNode[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map(node => [node.lat, node.lng] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, nodes]);
  
  return null;
}

export default function MapView({ nodes, edges, onNodeClick, height = '100%' }: MapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  
  // Fix for Leaflet marker icons in Next.js
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png'
      });
    }
  }, []);
  
  // Default map center and zoom if no nodes are provided
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City
  const defaultZoom = 3;
  
  // Calculate center from nodes if available
  const center = nodes.length > 0 
    ? [
        nodes.reduce((sum, node) => sum + node.lat, 0) / nodes.length,
        nodes.reduce((sum, node) => sum + node.lng, 0) / nodes.length
      ] as [number, number]
    : defaultCenter;
  
  // Manage map instance reference
  const handleMapReady = (map: L.Map) => {
    setMap(map);
  };
    
  return (
    <div style={{ height, width: '100%' }}>
      {nodes.length > 0 ? (
        <MapContainer
          center={center}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          ref={handleMapReady}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {nodes.map((node) => (
            <Marker 
              key={node.id} 
              position={[node.lat, node.lng]}
              eventHandlers={{
                click: () => onNodeClick && onNodeClick(node)
              }}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{node.label}</h3>
                  {node.type && <p className="text-sm">Type: {node.type}</p>}
                  <p className="text-sm">Coordinates: {node.lat.toFixed(6)}, {node.lng.toFixed(6)}</p>
                </div>
              </Popup>
              
              {/* Add a colored circle around the marker */}
              <Circle 
                center={[node.lat, node.lng]} 
                radius={300}
                pathOptions={{ 
                  color: node.color || '#3388FF',
                  fillColor: node.color || '#3388FF',
                  fillOpacity: 0.2
                }} 
              />
            </Marker>
          ))}
          
          <FitBounds nodes={nodes} />
        </MapContainer>
      ) : (
        <div className="flex justify-center items-center h-full bg-gray-100">
          <p className="text-gray-500">No location data available to display on map.</p>
        </div>
      )}
    </div>
  );
}
