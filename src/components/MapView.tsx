'use client';

import React, { useEffect, useState, useRef } from 'react';
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
// We no longer need the FitBounds helper component since we handle bounds fitting in the main component

export default function MapView({ nodes, edges, onNodeClick, height = '100%' }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  
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
  
  // Prevent scrolling issues when interacting with map
  // Add CSS to global styles to prevent map scrolling issues
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .fixed-position-map {
        position: relative !important;
        height: 100% !important;
        width: 100% !important;
        overflow: hidden !important;
      }
      .fixed-position-map .leaflet-container {
        position: absolute !important;
        height: 100% !important;
        width: 100% !important;
        outline: none !important;
      }
      .leaflet-container {
        /* Prevent scrolling behavior */
        touch-action: none !important;
      }
      /* Ensure the map container doesn't affect parent scrolling */
      .map-container-wrapper {
        position: relative;
        isolation: isolate;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Wrapper to ensure no scrolling impacts the parent
  useEffect(() => {
    const stopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    // Handle mousewheel events
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      // We still allow zooming with scroll on the map itself
    };
    
    if (containerRef.current) {
      containerRef.current.addEventListener('click', stopPropagation);
      containerRef.current.addEventListener('mousedown', stopPropagation);
      containerRef.current.addEventListener('touchstart', stopPropagation);
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', stopPropagation);
        containerRef.current.removeEventListener('mousedown', stopPropagation);
        containerRef.current.removeEventListener('touchstart', stopPropagation);
        containerRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  
  // Initialize map only once on component mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create new map instance
    const newMap = L.map(containerRef.current, {
      center: center,
      zoom: defaultZoom,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        })
      ]
    });

    // Store map reference
    mapRef.current = newMap;
    setMapReady(true);

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Handle container resize and map updates
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    // Force map to invalidate size and redraw when component updates
    const resizeMap = () => {
      if (mapRef.current) {
        // Invalidate size with a small delay to ensure DOM has updated
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize(true);

            // Also update bounds if we have nodes
            if (nodes.length > 0) {
              const bounds = L.latLngBounds(nodes.map(node => [node.lat, node.lng] as L.LatLngTuple));
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          }
        }, 200);
      }
    };

    // Call resize immediately
    resizeMap();

    // Also listen for window resize events
    window.addEventListener('resize', resizeMap);
    
    return () => {
      window.removeEventListener('resize', resizeMap);
    };
  }, [mapReady, height, nodes]); // Re-run when height or nodes change
    
  return (
    <div
      style={{
        height,
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="map-container fixed-position-map"
    >
      {nodes.length > 0 ? (
        <div
          ref={containerRef}
          style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            zIndex: 1
          }}
          className="leaflet-container"
        >
          {mapReady && nodes.map((node) => (
            // We manually add markers after the map is ready
            mapRef.current && L.marker([node.lat, node.lng], {
              title: node.label,
              alt: node.label
            })
              .addTo(mapRef.current)
              .bindPopup(`
                <div>
                  <h3 class="font-bold">${node.label}</h3>
                  ${node.type ? `<p class="text-sm">Type: ${node.type}</p>` : ''}
                  <p class="text-sm">Coordinates: ${node.lat.toFixed(6)}, ${node.lng.toFixed(6)}</p>
                </div>
              `)
              .on('click', () => onNodeClick && onNodeClick(node)),
            // Add a colored circle around the marker
            mapRef.current && L.circle([node.lat, node.lng], {
              radius: 300,
              color: node.color || '#3388FF',
              fillColor: node.color || '#3388FF',
              fillOpacity: 0.2
            }).addTo(mapRef.current),
            <React.Fragment key={node.id}></React.Fragment> // Empty fragment as React needs a return value
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-full bg-gray-100">
          <p className="text-gray-500">No location data available to display on map.</p>
        </div>
      )}
    </div>
  );
}
