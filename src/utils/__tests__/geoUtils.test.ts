import {
  hasGeoData,
  isValidCoordinate,
  extractGeoData,
  transformGeoData,
  GeoNode,
  GeoEdge
} from '../geoUtils'

describe('geoUtils', () => {
  describe('isValidCoordinate', () => {
    it('should validate valid latitude values', () => {
      expect(isValidCoordinate(0, 0)).toBe(true)
      expect(isValidCoordinate(90, 0)).toBe(true)
      expect(isValidCoordinate(-90, 0)).toBe(true)
      expect(isValidCoordinate(45.5, 0)).toBe(true)
      expect(isValidCoordinate(-45.5, 0)).toBe(true)
    })

    it('should validate valid longitude values', () => {
      expect(isValidCoordinate(0, 0)).toBe(true)
      expect(isValidCoordinate(0, 180)).toBe(true)
      expect(isValidCoordinate(0, -180)).toBe(true)
      expect(isValidCoordinate(0, 90.5)).toBe(true)
      expect(isValidCoordinate(0, -90.5)).toBe(true)
    })

    it('should reject invalid latitude values', () => {
      expect(isValidCoordinate(91, 0)).toBe(false)
      expect(isValidCoordinate(-91, 0)).toBe(false)
      expect(isValidCoordinate(100, 0)).toBe(false)
      expect(isValidCoordinate(-100, 0)).toBe(false)
    })

    it('should reject invalid longitude values', () => {
      expect(isValidCoordinate(0, 181)).toBe(false)
      expect(isValidCoordinate(0, -181)).toBe(false)
      expect(isValidCoordinate(0, 200)).toBe(false)
      expect(isValidCoordinate(0, -200)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      expect(isValidCoordinate('45', 0)).toBe(false)
      expect(isValidCoordinate(45, '0')).toBe(false)
      expect(isValidCoordinate(null, 0)).toBe(false)
      expect(isValidCoordinate(45, undefined)).toBe(false)
      expect(isValidCoordinate(NaN, 0)).toBe(false)
      expect(isValidCoordinate(45, NaN)).toBe(false)
    })
  })

  describe('hasGeoData', () => {
    it('should detect direct lat/lng properties', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
        ]
      }
      
      expect(hasGeoData(data)).toBe(true)
    })

    it('should detect coordinates object properties', () => {
      const data = {
        q: [
          { name: 'Location 1', location: { lat: 40.7128, lng: -74.0060 } },
          { name: 'Location 2', geo: { latitude: 34.0522, longitude: -118.2437 } }
        ]
      }
      
      expect(hasGeoData(data)).toBe(true)
    })

    it('should detect GeoJSON format coordinates', () => {
      const data = {
        q: [
          { name: 'Location 1', coordinates: [-74.0060, 40.7128] },
          { name: 'Location 2', position: [-118.2437, 34.0522] }
        ]
      }
      
      expect(hasGeoData(data)).toBe(true)
    })

    it('should detect Dgraph location field', () => {
      const data = {
        q: [
          { name: 'Location 1', location: { coordinates: [-74.0060, 40.7128] } },
          { name: 'Location 2', location: { coordinates: [-118.2437, 34.0522] } }
        ]
      }
      
      expect(hasGeoData(data)).toBe(true)
    })

    it('should return false for data without coordinates', () => {
      const data = {
        q: [
          { name: 'Location 1', address: '123 Main St' },
          { name: 'Location 2', city: 'New York' }
        ]
      }
      
      expect(hasGeoData(data)).toBe(false)
    })

    it('should return false for null/undefined data', () => {
      expect(hasGeoData(null)).toBe(false)
      expect(hasGeoData(undefined)).toBe(false)
      expect(hasGeoData({})).toBe(false)
    })

    it('should handle nested data structures', () => {
      const data = {
        q: [
          {
            name: 'Location 1',
            details: {
              coordinates: [-74.0060, 40.7128]
            }
          }
        ]
      }
      
      expect(hasGeoData(data)).toBe(false) // Only checks top level
    })
  })

  describe('extractGeoData', () => {
    it('should extract data with direct lat/lng properties', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0]).toMatchObject({
        id: expect.any(String),
        label: 'Location 1',
        lat: 40.7128,
        lng: -74.0060
      })
    })

    it('should extract data with coordinates object', () => {
      const data = {
        q: [
          { name: 'Location 1', location: { lat: 40.7128, lng: -74.0060 } },
          { name: 'Location 2', geo: { latitude: 34.0522, longitude: -118.2437 } }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0].lat).toBe(40.7128)
      expect(result.nodes[0].lng).toBe(-74.0060)
    })

    it('should extract GeoJSON format coordinates', () => {
      const data = {
        q: [
          { name: 'Location 1', coordinates: [-74.0060, 40.7128] },
          { name: 'Location 2', position: [-118.2437, 34.0522] }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0].lat).toBe(40.7128)
      expect(result.nodes[0].lng).toBe(-74.0060)
    })

    it('should generate unique IDs for nodes', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes[0].id).not.toBe(result.nodes[1].id)
      expect(result.nodes[0].id).toMatch(/^geo_\d+$/)
      expect(result.nodes[1].id).toMatch(/^geo_\d+$/)
    })

    it('should assign colors to nodes', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes[0].color).toBeDefined()
      expect(result.nodes[1].color).toBeDefined()
      expect(typeof result.nodes[0].color).toBe('string')
    })

    it('should preserve raw data', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.7128, longitude: -74.0060, extra: 'data' }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes[0].raw).toEqual(data.q[0])
    })

    it('should handle empty data', () => {
      const data = { q: [] }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(0)
      expect(result.edges).toHaveLength(0)
    })

    it('should handle data without geo coordinates', () => {
      const data = {
        q: [
          { name: 'Location 1', address: '123 Main St' },
          { name: 'Location 2', city: 'New York' }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(0)
      expect(result.edges).toHaveLength(0)
    })
  })

  describe('transformGeoData', () => {
    it('should transform nodes to map markers format', () => {
      const geoData = {
        nodes: [
          {
            id: 'geo_1',
            label: 'Location 1',
            lat: 40.7128,
            lng: -74.0060,
            color: '#ff0000',
            raw: { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 }
          }
        ],
        edges: []
      }
      
      const result = transformGeoData(geoData)
      
      expect(result.markers).toHaveLength(1)
      expect(result.markers[0]).toMatchObject({
        id: 'geo_1',
        position: [40.7128, -74.0060],
        popup: 'Location 1'
      })
    })

    it('should handle multiple nodes', () => {
      const geoData = {
        nodes: [
          {
            id: 'geo_1',
            label: 'Location 1',
            lat: 40.7128,
            lng: -74.0060,
            color: '#ff0000',
            raw: { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 }
          },
          {
            id: 'geo_2',
            label: 'Location 2',
            lat: 34.0522,
            lng: -118.2437,
            color: '#00ff00',
            raw: { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
          }
        ],
        edges: []
      }
      
      const result = transformGeoData(geoData)
      
      expect(result.markers).toHaveLength(2)
      expect(result.markers[0].position).toEqual([40.7128, -74.0060])
      expect(result.markers[1].position).toEqual([34.0522, -118.2437])
    })

    it('should calculate bounds from nodes', () => {
      const geoData = {
        nodes: [
          {
            id: 'geo_1',
            label: 'Location 1',
            lat: 40.7128,
            lng: -74.0060,
            color: '#ff0000',
            raw: { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 }
          },
          {
            id: 'geo_2',
            label: 'Location 2',
            lat: 34.0522,
            lng: -118.2437,
            color: '#00ff00',
            raw: { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
          }
        ],
        edges: []
      }
      
      const result = transformGeoData(geoData)
      
      expect(result.bounds).toBeDefined()
      expect(result.bounds).toEqual([
        [34.0522, -118.2437], // Southwest
        [40.7128, -74.0060]   // Northeast
      ])
    })

    it('should handle single node bounds', () => {
      const geoData = {
        nodes: [
          {
            id: 'geo_1',
            label: 'Location 1',
            lat: 40.7128,
            lng: -74.0060,
            color: '#ff0000',
            raw: { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 }
          }
        ],
        edges: []
      }
      
      const result = transformGeoData(geoData)
      
      expect(result.bounds).toEqual([
        [40.7128, -74.0060], // Southwest
        [40.7128, -74.0060]  // Northeast (same as southwest for single point)
      ])
    })

    it('should handle empty geo data', () => {
      const geoData = { nodes: [], edges: [] }
      
      const result = transformGeoData(geoData)
      
      expect(result.markers).toHaveLength(0)
      expect(result.bounds).toBeUndefined()
    })

    it('should handle nodes with missing coordinates', () => {
      const geoData = {
        nodes: [
          {
            id: 'geo_1',
            label: 'Location 1',
            lat: 40.7128,
            lng: -74.0060,
            color: '#ff0000',
            raw: { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 }
          },
          {
            id: 'geo_2',
            label: 'Location 2',
            lat: undefined,
            lng: undefined,
            color: '#00ff00',
            raw: { name: 'Location 2' }
          }
        ],
        edges: []
      }
      
      const result = transformGeoData(geoData)
      
      expect(result.markers).toHaveLength(1) // Only valid coordinates
      expect(result.markers[0].id).toBe('geo_1')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle invalid coordinate values gracefully', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 'invalid', longitude: 'invalid' },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(1) // Only valid coordinates
      expect(result.nodes[0].label).toBe('Location 2')
    })

    it('should handle mixed coordinate formats', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.7128, longitude: -74.0060 },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 },
          { name: 'Location 3', coordinates: [-122.4194, 37.7749] },
          { name: 'Location 4', location: { coordinates: [-80.1918, 25.7617] } }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(4)
      expect(result.nodes[0].lat).toBe(40.7128)
      expect(result.nodes[1].lat).toBe(34.0522)
      expect(result.nodes[2].lat).toBe(37.7749)
      expect(result.nodes[3].lat).toBe(25.7617)
    })

    it('should handle very large coordinate values', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 1000, longitude: 2000 }, // Invalid
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }    // Valid
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(1) // Only valid coordinates
      expect(result.nodes[0].label).toBe('Location 2')
    })

    it('should handle decimal precision in coordinates', () => {
      const data = {
        q: [
          { name: 'Location 1', latitude: 40.71280000000001, longitude: -74.00600000000001 },
          { name: 'Location 2', lat: 34.0522, lng: -118.2437 }
        ]
      }
      
      const result = extractGeoData(data)
      
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0].lat).toBe(40.71280000000001)
      expect(result.nodes[0].lng).toBe(-74.00600000000001)
    })
  })

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = {
        q: Array.from({ length: 1000 }, (_, i) => ({
          name: `Location ${i}`,
          latitude: 40 + (Math.random() - 0.5) * 10,
          longitude: -74 + (Math.random() - 0.5) * 10
        }))
      }
      
      const startTime = performance.now()
      const result = extractGeoData(largeData)
      const endTime = performance.now()
      
      // Should process 1000 locations in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(result.nodes).toHaveLength(1000)
    })
  })
})
