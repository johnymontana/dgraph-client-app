import { 
  parseVariables, 
  validateVariables, 
  substituteVariables,
  extractVariableNames
} from '../dqlVariables'

describe('DQL Variables Utils', () => {
  describe('parseVariables', () => {
    it('should parse valid variable definitions', () => {
      const variables = [
        { name: 'name', value: 'John', type: 'String' },
        { name: 'age', value: '30', type: 'Int' }
      ]
      
      const result = parseVariables(variables)
      
      expect(result).toEqual({
        name: 'John',
        age: '30'
      })
    })

    it('should handle empty variables array', () => {
      const result = parseVariables([])
      
      expect(result).toEqual({})
    })

    it('should handle variables without type', () => {
      const variables = [
        { name: 'name', value: 'John' }
      ]
      
      const result = parseVariables(variables)
      
      expect(result).toEqual({
        name: 'John'
      })
    })

    it('should convert numeric values appropriately', () => {
      const variables = [
        { name: 'age', value: '30', type: 'Int' },
        { name: 'height', value: '5.8', type: 'Float' }
      ]
      
      const result = parseVariables(variables)
      
      expect(result.age).toBe(30)
      expect(result.height).toBe(5.8)
    })
  })

  describe('validateVariables', () => {
    it('should validate correct variable definitions', () => {
      const variables = [
        { name: 'name', value: 'John', type: 'String' },
        { name: 'age', value: '30', type: 'Int' }
      ]
      
      const result = validateVariables(variables)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing variable names', () => {
      const variables = [
        { name: '', value: 'John', type: 'String' }
      ]
      
      const result = validateVariables(variables)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('name'))).toBe(true)
    })

    it('should detect invalid variable names', () => {
      const variables = [
        { name: '123invalid', value: 'John', type: 'String' }
      ]
      
      const result = validateVariables(variables)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('name'))).toBe(true)
    })

    it('should validate variable types', () => {
      const variables = [
        { name: 'age', value: 'not-a-number', type: 'Int' }
      ]
      
      const result = validateVariables(variables)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('type'))).toBe(true)
    })
  })

  describe('substituteVariables', () => {
    it('should substitute variables in query string', () => {
      const query = 'query($name: String) { q(func: eq(name, $name)) { name } }'
      const variables = { name: 'John' }
      
      const result = substituteVariables(query, variables)
      
      expect(result).toBe('query($name: String) { q(func: eq(name, "John")) { name } }')
    })

    it('should handle multiple variables', () => {
      const query = 'query($name: String, $age: Int) { q(func: eq(name, $name)) @filter(eq(age, $age)) { name age } }'
      const variables = { name: 'John', age: 30 }
      
      const result = substituteVariables(query, variables)
      
      expect(result).toBe('query($name: String, $age: Int) { q(func: eq(name, "John")) @filter(eq(age, 30)) { name age } }')
    })

    it('should handle variables with special characters', () => {
      const query = 'query($name: String) { q(func: eq(name, $name)) { name } }'
      const variables = { name: "O'Connor" }
      
      const result = substituteVariables(query, variables)
      
      expect(result).toBe('query($name: String) { q(func: eq(name, "O\'Connor")) { name } }')
    })

    it('should handle queries without variables', () => {
      const query = '{ name }'
      const variables = {}
      
      const result = substituteVariables(query, variables)
      
      expect(result).toBe(query)
    })

    it('should handle undefined variables gracefully', () => {
      const query = 'query($name: String) { q(func: eq(name, $name)) { name } }'
      const variables = { name: undefined }
      
      const result = substituteVariables(query, variables)
      
      expect(result).toBe('query($name: String) { q(func: eq(name, undefined)) { name } }')
    })
  })

  describe('extractVariableNames', () => {
    it('should extract variable names from query', () => {
      const query = 'query($name: String, $age: Int) { q(func: eq(name, $name)) @filter(eq(age, $age)) { name age } }'
      
      const result = extractVariableNames(query)
      
      expect(result).toEqual(['name', 'age'])
    })

    it('should handle queries without variables', () => {
      const query = '{ name }'
      
      const result = extractVariableNames(query)
      
      expect(result).toEqual([])
    })

    it('should handle malformed queries gracefully', () => {
      const query = 'query($name: String { q(func: eq(name, $name)) { name } }'
      
      const result = extractVariableNames(query)
      
      expect(Array.isArray(result)).toBe(true)
    })

    it('should extract variables from different query formats', () => {
      const queries = [
        'query($name: String) { name }',
        'mutation($input: UserInput) { set: $input }',
        '{ q(func: eq(name, $name)) { name } }'
      ]
      
      queries.forEach(query => {
        const result = extractVariableNames(query)
        expect(Array.isArray(result)).toBe(true)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle very long variable names', () => {
      const longName = 'a'.repeat(1000)
      const variables = [
        { name: longName, value: 'test', type: 'String' }
      ]
      
      const result = parseVariables(variables)
      
      expect(result[longName]).toBe('test')
    })

    it('should handle very long variable values', () => {
      const longValue = 'value'.repeat(1000)
      const variables = [
        { name: 'test', value: longValue, type: 'String' }
      ]
      
      const result = parseVariables(variables)
      
      expect(result.test).toBe(longValue)
    })

    it('should handle special characters in variable names', () => {
      const variables = [
        { name: 'user_name', value: 'John', type: 'String' },
        { name: 'user-age', value: '30', type: 'Int' }
      ]
      
      const result = parseVariables(variables)
      
      expect(result.user_name).toBe('John')
      expect(result['user-age']).toBe(30)
    })
  })
})
