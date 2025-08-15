import { 
  parseSchema, 
  extractTypes, 
  extractFields, 
  validateSchema,
  getSchemaSuggestions
} from '../schemaParser'

describe('Schema Parser Utils', () => {
  const mockSchema = {
    schema: [
      {
        predicate: 'name',
        type: 'string',
        index: true,
        tokenizer: ['exact']
      },
      {
        predicate: 'age',
        type: 'int',
        index: true
      },
      {
        predicate: 'friends',
        type: 'uid',
        list: true
      },
      {
        predicate: 'dgraph.type',
        type: 'string',
        index: true,
        tokenizer: ['exact']
      }
    ]
  }

  const mockGraphQLSchema = {
    data: {
      __schema: {
        types: [
          {
            name: 'Person',
            fields: [
              { name: 'uid', type: { name: 'ID' } },
              { name: 'name', type: { name: 'String' } },
              { name: 'age', type: { name: 'Int' } },
              { name: 'friends', type: { name: 'Person', kind: 'OBJECT' } }
            ]
          },
          {
            name: 'Company',
            fields: [
              { name: 'uid', type: { name: 'ID' } },
              { name: 'name', type: { name: 'String' } },
              { name: 'industry', type: { name: 'String' } }
            ]
          }
        ]
      }
    }
  }

  describe('parseSchema', () => {
    it('should parse Dgraph schema format', () => {
      const result = parseSchema(mockSchema)
      
      expect(result).toBeDefined()
      expect(result.types).toBeDefined()
      expect(Array.isArray(result.types)).toBe(true)
    })

    it('should parse GraphQL schema format', () => {
      const result = parseSchema(mockGraphQLSchema)
      
      expect(result).toBeDefined()
      expect(result.types).toBeDefined()
      expect(Array.isArray(result.types)).toBe(true)
    })

    it('should handle empty schema', () => {
      const result = parseSchema({})
      
      expect(result).toBeDefined()
      expect(result.types).toEqual([])
    })

    it('should handle null schema', () => {
      const result = parseSchema(null as any)
      
      expect(result).toBeDefined()
      expect(result.types).toEqual([])
    })

    it('should extract type information correctly', () => {
      const result = parseSchema(mockSchema)
      
      expect(result.types.some(t => t.name === 'Person')).toBe(true)
      expect(result.types.some(t => t.name === 'Company')).toBe(true)
    })
  })

  describe('extractTypes', () => {
    it('should extract types from Dgraph schema', () => {
      const types = extractTypes(mockSchema)
      
      expect(Array.isArray(types)).toBe(true)
      expect(types.length).toBeGreaterThan(0)
    })

    it('should extract types from GraphQL schema', () => {
      const types = extractTypes(mockGraphQLSchema)
      
      expect(Array.isArray(types)).toBe(true)
      expect(types.some(t => t.name === 'Person')).toBe(true)
      expect(types.some(t => t.name === 'Company')).toBe(true)
    })

    it('should handle empty types array', () => {
      const types = extractTypes({ schema: [] })
      
      expect(Array.isArray(types)).toBe(true)
      expect(types.length).toBe(0)
    })

    it('should extract type names correctly', () => {
      const types = extractTypes(mockGraphQLSchema)
      const typeNames = types.map(t => t.name)
      
      expect(typeNames).toContain('Person')
      expect(typeNames).toContain('Company')
    })
  })

  describe('extractFields', () => {
    it('should extract fields from Dgraph schema', () => {
      const fields = extractFields(mockSchema)
      
      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBeGreaterThan(0)
    })

    it('should extract fields from GraphQL schema', () => {
      const fields = extractFields(mockGraphQLSchema)
      
      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBeGreaterThan(0)
    })

    it('should extract field names correctly', () => {
      const fields = extractFields(mockGraphQLSchema)
      const fieldNames = fields.map(f => f.name)
      
      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('age')
      expect(fieldNames).toContain('friends')
    })

    it('should extract field types correctly', () => {
      const fields = extractFields(mockGraphQLSchema)
      const nameField = fields.find(f => f.name === 'name')
      
      expect(nameField).toBeDefined()
      expect(nameField?.type).toBe('String')
    })

    it('should handle fields without types', () => {
      const fields = extractFields({ schema: [{ predicate: 'test' }] })
      
      expect(Array.isArray(fields)).toBe(true)
      expect(fields.length).toBe(1)
    })
  })

  describe('validateSchema', () => {
    it('should validate valid schema', () => {
      const result = validateSchema(mockSchema)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate valid GraphQL schema', () => {
      const result = validateSchema(mockGraphQLSchema)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid schema structure', () => {
      const invalidSchema = { invalid: 'structure' }
      const result = validateSchema(invalidSchema)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing required fields', () => {
      const invalidSchema = { schema: [{ predicate: 'name' }] }
      const result = validateSchema(invalidSchema)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle empty schema validation', () => {
      const result = validateSchema({})
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('getSchemaSuggestions', () => {
    it('should return suggestions for empty input', () => {
      const suggestions = getSchemaSuggestions('', mockGraphQLSchema)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return filtered suggestions based on input', () => {
      const suggestions = getSchemaSuggestions('Per', mockGraphQLSchema)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.some(s => s.label.includes('Person'))).toBe(true)
    })

    it('should return empty array for no matches', () => {
      const suggestions = getSchemaSuggestions('xyz123', mockGraphQLSchema)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBe(0)
    })

    it('should include type and field suggestions', () => {
      const suggestions = getSchemaSuggestions('', mockGraphQLSchema)
      
      const hasTypes = suggestions.some(s => s.type === 'type')
      const hasFields = suggestions.some(s => s.type === 'field')
      
      expect(hasTypes).toBe(true)
      expect(hasFields).toBe(true)
    })

    it('should handle null schema gracefully', () => {
      const suggestions = getSchemaSuggestions('test', null as any)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle very large schemas', () => {
      const largeSchema = {
        schema: Array.from({ length: 1000 }, (_, i) => ({
          predicate: `field${i}`,
          type: 'string'
        }))
      }
      
      const result = parseSchema(largeSchema)
      
      expect(result.types.length).toBe(1000)
    })

    it('should handle malformed field data', () => {
      const malformedSchema = {
        schema: [
          { predicate: 'name', type: 'string' },
          { predicate: null, type: undefined },
          { predicate: 'age', type: 'int' }
        ]
      }
      
      const result = parseSchema(malformedSchema)
      
      expect(result.types.length).toBeGreaterThan(0)
    })

    it('should handle circular references gracefully', () => {
      const circularSchema = {
        schema: [
          { predicate: 'self', type: 'uid' }
        ]
      }
      
      const result = parseSchema(circularSchema)
      
      expect(result).toBeDefined()
      expect(result.types).toBeDefined()
    })
  })
})
