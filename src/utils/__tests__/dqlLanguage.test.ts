import { 
  getDQLKeywords, 
  getDQLFunctions, 
  getDQLPredicates,
  getDQLSuggestions,
  isDQLQuery,
  validateDQLSyntax
} from '../dqlLanguage'

describe('DQL Language Utils', () => {
  describe('getDQLKeywords', () => {
    it('should return array of DQL keywords', () => {
      const keywords = getDQLKeywords()
      
      expect(Array.isArray(keywords)).toBe(true)
      expect(keywords.length).toBeGreaterThan(0)
      expect(keywords).toContain('query')
      expect(keywords).toContain('mutation')
      expect(keywords).toContain('schema')
      expect(keywords).toContain('type')
    })

    it('should return unique keywords', () => {
      const keywords = getDQLKeywords()
      const uniqueKeywords = new Set(keywords)
      
      expect(keywords.length).toBe(uniqueKeywords.size)
    })
  })

  describe('getDQLFunctions', () => {
    it('should return array of DQL functions', () => {
      const functions = getDQLFunctions()
      
      expect(Array.isArray(functions)).toBe(true)
      expect(functions.length).toBeGreaterThan(0)
      expect(functions).toContain('count')
      expect(functions).toContain('sum')
      expect(functions).toContain('avg')
    })

    it('should return unique functions', () => {
      const functions = getDQLFunctions()
      const uniqueFunctions = new Set(functions)
      
      expect(functions.length).toBe(uniqueFunctions.size)
    })
  })

  describe('getDQLPredicates', () => {
    it('should return array of DQL predicates', () => {
      const predicates = getDQLPredicates()
      
      expect(Array.isArray(predicates)).toBe(true)
      expect(predicates.length).toBeGreaterThan(0)
      expect(predicates).toContain('uid')
      expect(predicates).toContain('dgraph.type')
    })

    it('should return unique predicates', () => {
      const predicates = getDQLPredicates()
      const uniquePredicates = new Set(predicates)
      
      expect(predicates.length).toBe(uniquePredicates.size)
    })
  })

  describe('getDQLSuggestions', () => {
    it('should return suggestions for empty input', () => {
      const suggestions = getDQLSuggestions('')
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return filtered suggestions based on input', () => {
      const suggestions = getDQLSuggestions('qu')
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.some(s => s.label.includes('query'))).toBe(true)
    })

    it('should return empty array for no matches', () => {
      const suggestions = getDQLSuggestions('xyz123')
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBe(0)
    })

    it('should include keywords, functions, and predicates', () => {
      const suggestions = getDQLSuggestions('')
      
      const hasKeywords = suggestions.some(s => s.type === 'keyword')
      const hasFunctions = suggestions.some(s => s.type === 'function')
      const hasPredicates = suggestions.some(s => s.type === 'predicate')
      
      expect(hasKeywords).toBe(true)
      expect(hasFunctions).toBe(true)
      expect(hasPredicates).toBe(true)
    })
  })

  describe('isDQLQuery', () => {
    it('should return true for valid DQL queries', () => {
      expect(isDQLQuery('{ name }')).toBe(true)
      expect(isDQLQuery('query { name }')).toBe(true)
      expect(isDQLQuery('mutation { set: { name: "John" } }')).toBe(true)
      expect(isDQLQuery('schema {}')).toBe(true)
    })

    it('should return false for invalid DQL queries', () => {
      expect(isDQLQuery('')).toBe(false)
      expect(isDQLQuery('   ')).toBe(false)
      expect(isDQLQuery('SELECT * FROM users')).toBe(false)
      expect(isDQLQuery('console.log("hello")')).toBe(false)
    })

    it('should handle queries with variables', () => {
      expect(isDQLQuery('query($name: String) { name }')).toBe(true)
      expect(isDQLQuery('mutation($input: UserInput) { set: $input }')).toBe(true)
    })
  })

  describe('validateDQLSyntax', () => {
    it('should return valid for correct DQL syntax', () => {
      const result = validateDQLSyntax('{ name }')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for malformed DQL', () => {
      const result = validateDQLSyntax('{ name')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle empty input', () => {
      const result = validateDQLSyntax('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle whitespace-only input', () => {
      const result = validateDQLSyntax('   ')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate complex queries', () => {
      const complexQuery = `
        query($name: String) {
          q(func: eq(name, $name)) {
            uid
            name
            friends {
              name
              age
            }
          }
        }
      `
      const result = validateDQLSyntax(complexQuery)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing closing braces', () => {
      const result = validateDQLSyntax('{ name { age')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('brace'))).toBe(true)
    })

    it('should detect missing opening braces', () => {
      const result = validateDQLSyntax('name }')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('brace'))).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle very long queries', () => {
      const longQuery = '{ ' + 'name '.repeat(1000) + '}'
      const result = validateDQLSyntax(longQuery)
      
      expect(typeof result.isValid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should handle special characters', () => {
      const specialQuery = '{ name: "John\'s" age: 30 }'
      const result = validateDQLSyntax(specialQuery)
      
      expect(typeof result.isValid).toBe('boolean')
    })

    it('should handle unicode characters', () => {
      const unicodeQuery = '{ name: "José" age: 30 }'
      const result = validateDQLSyntax(unicodeQuery)
      
      expect(typeof result.isValid).toBe('boolean')
    })
  })
})
