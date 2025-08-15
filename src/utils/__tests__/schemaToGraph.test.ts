import Graphology from 'graphology'
import {
  schemaToGraph,
  generateTypeInfo,
  ensureNonEmptyGraph,
  parseSchema,
  extractTypes,
  extractPredicates,
  createGraphFromTypes
} from '../schemaToGraph'

describe('schemaToGraph', () => {
  describe('parseSchema', () => {
    it('should parse simple schema with types', () => {
      const schemaText = `
        type Person {
          name: string @index(exact)
          age: int
        }
        
        type Company {
          name: string @index(exact)
          industry: string
        }
      `
      
      const result = parseSchema(schemaText)
      
      expect(result.types).toHaveLength(2)
      expect(result.types[0].name).toBe('Person')
      expect(result.types[0].fields).toHaveLength(2)
      expect(result.types[1].name).toBe('Company')
      expect(result.types[1].fields).toHaveLength(2)
    })

    it('should parse schema with directives', () => {
      const schemaText = `
        type Person {
          name: string @index(exact) @lang
          age: int @index(int)
          email: string @index(exact) @upsert
        }
      `
      
      const result = parseSchema(schemaText)
      
      expect(result.types).toHaveLength(1)
      expect(result.types[0].fields).toHaveLength(3)
      expect(result.types[0].fields[0].directives).toContain('@index(exact)')
      expect(result.types[0].fields[0].directives).toContain('@lang')
    })

    it('should parse schema with array types', () => {
      const schemaText = `
        type Person {
          name: string
          friends: [Person]
          tags: [string]
        }
      `
      
      const result = parseSchema(schemaText)
      
      expect(result.types).toHaveLength(1)
      expect(result.types[0].fields[1].type).toBe('[Person]')
      expect(result.types[0].fields[2].type).toBe('[string]')
    })

    it('should parse schema with comments', () => {
      const schemaText = `
        # This is a comment
        type Person {
          name: string # Field comment
          age: int
        }
        # Another comment
      `
      
      const result = parseSchema(schemaText)
      
      expect(result.types).toHaveLength(1)
      expect(result.types[0].name).toBe('Person')
      expect(result.types[0].fields).toHaveLength(2)
    })

    it('should handle empty schema', () => {
      const schemaText = ''
      
      const result = parseSchema(schemaText)
      
      expect(result.types).toHaveLength(0)
      expect(result.predicates).toHaveLength(0)
    })

    it('should handle schema with only comments', () => {
      const schemaText = '# Comment 1\n# Comment 2\n  # Comment 3'
      
      const result = parseSchema(schemaText)
      
      expect(result.types).toHaveLength(0)
      expect(result.predicates).toHaveLength(0)
    })
  })

  describe('extractTypes', () => {
    it('should extract type definitions', () => {
      const schemaText = `
        type Person {
          name: string
          age: int
        }
        
        type Company {
          name: string
          industry: string
        }
      `
      
      const types = extractTypes(schemaText)
      
      expect(types).toHaveLength(2)
      expect(types[0].name).toBe('Person')
      expect(types[1].name).toBe('Company')
    })

    it('should extract fields with types', () => {
      const schemaText = `
        type Person {
          name: string @index(exact)
          age: int
          email: string @index(exact)
          active: bool
          score: float
          created_at: datetime
        }
      `
      
      const types = extractTypes(schemaText)
      
      expect(types[0].fields).toHaveLength(6)
      expect(types[0].fields[0]).toMatchObject({
        name: 'name',
        type: 'string',
        directives: ['@index(exact)']
      })
      expect(types[0].fields[1]).toMatchObject({
        name: 'age',
        type: 'int',
        directives: []
      })
    })

    it('should handle complex field types', () => {
      const schemaText = `
        type Person {
          id: string @id
          name: string @index(exact)
          friends: [Person]
          works_at: Company
          tags: [string]
          metadata: [Metadata]
        }
      `
      
      const types = extractTypes(schemaText)
      
      expect(types[0].fields).toHaveLength(6)
      expect(types[0].fields[2].type).toBe('[Person]')
      expect(types[0].fields[3].type).toBe('Company')
      expect(types[0].fields[4].type).toBe('[string]')
      expect(types[0].fields[5].type).toBe('[Metadata]')
    })

    it('should handle malformed type definitions gracefully', () => {
      const schemaText = `
        type Person {
          name: string
          age: int
        }
        
        type Company {
          name: string
          # Missing closing brace
      `
      
      const types = extractTypes(schemaText)
      
      // Should extract the first valid type
      expect(types).toHaveLength(1)
      expect(types[0].name).toBe('Person')
    })
  })

  describe('extractPredicates', () => {
    it('should extract predicate definitions', () => {
      const schemaText = `
        name: string @index(exact)
        age: int @index(int)
        email: string @index(exact)
        works_at: uid @reverse
      `
      
      const predicates = extractPredicates(schemaText)
      
      expect(predicates).toHaveLength(4)
      expect(predicates[0]).toMatchObject({
        predicate: 'name',
        type: 'string'
      })
      expect(predicates[1]).toMatchObject({
        predicate: 'age',
        type: 'int'
      })
    })

    it('should handle predicates with directives', () => {
      const schemaText = `
        name: string @index(exact) @lang
        age: int @index(int) @count
        email: string @index(exact) @upsert
      `
      
      const predicates = extractPredicates(schemaText)
      
      expect(predicates[0].directives).toContain('@index(exact)')
      expect(predicates[0].directives).toContain('@lang')
      expect(predicates[1].directives).toContain('@index(int)')
      expect(predicates[1].directives).toContain('@count')
    })
  })

  describe('createGraphFromTypes', () => {
    it('should create graph with nodes for each type', () => {
      const types = [
        {
          name: 'Person',
          fields: [
            { name: 'name', type: 'string', directives: [] },
            { name: 'age', type: 'int', directives: [] }
          ]
        },
        {
          name: 'Company',
          fields: [
            { name: 'name', type: 'string', directives: [] },
            { name: 'industry', type: 'string', directives: [] }
          ]
        }
      ]
      
      const graph = createGraphFromTypes(types)
      
      expect(graph.order).toBe(2)
      expect(graph.hasNode('Person')).toBe(true)
      expect(graph.hasNode('Company')).toBe(true)
    })

    it('should create edges for relationships', () => {
      const types = [
        {
          name: 'Person',
          fields: [
            { name: 'name', type: 'string', directives: [] },
            { name: 'works_at', type: 'Company', directives: [] },
            { name: 'friends', type: '[Person]', directives: [] }
          ]
        },
        {
          name: 'Company',
          fields: [
            { name: 'name', type: 'string', directives: [] },
            { name: 'employees', type: '[Person]', directives: [] }
          ]
        }
      ]
      
      const graph = createGraphFromTypes(types)
      
      expect(graph.size).toBeGreaterThan(0)
      expect(graph.hasEdge('Person', 'Company')).toBe(true)
      expect(graph.hasEdge('Person', 'Person')).toBe(true)
    })

    it('should assign colors to nodes', () => {
      const types = [
        {
          name: 'Person',
          fields: []
        }
      ]
      
      const graph = createGraphFromTypes(types)
      
      const nodeAttributes = graph.getNodeAttributes('Person')
      expect(nodeAttributes.color).toBeDefined()
      expect(typeof nodeAttributes.color).toBe('string')
    })

    it('should handle types with no relationships', () => {
      const types = [
        {
          name: 'Person',
          fields: [
            { name: 'name', type: 'string', directives: [] },
            { name: 'age', type: 'int', directives: [] }
          ]
        }
      ]
      
      const graph = createGraphFromTypes(types)
      
      expect(graph.order).toBe(1)
      expect(graph.size).toBe(0) // No edges
    })
  })

  describe('generateTypeInfo', () => {
    it('should generate type information for graph', () => {
      const graph = new Graphology()
      graph.addNode('Person', { color: '#ff0000' })
      graph.addNode('Company', { color: '#00ff00' })
      
      const typeInfo = generateTypeInfo(graph)
      
      expect(typeInfo).toHaveLength(2)
      expect(typeInfo[0]).toMatchObject({
        type: 'Person',
        color: '#ff0000',
        count: 1
      })
      expect(typeInfo[1]).toMatchObject({
        type: 'Company',
        color: '#00ff00',
        count: 1
      })
    })

    it('should count multiple nodes of same type', () => {
      const graph = new Graphology()
      graph.addNode('Person_1', { color: '#ff0000' })
      graph.addNode('Person_2', { color: '#ff0000' })
      graph.addNode('Company', { color: '#00ff00' })
      
      const typeInfo = generateTypeInfo(graph)
      
      const personType = typeInfo.find(t => t.type === 'Person')
      expect(personType?.count).toBe(2)
      
      const companyType = typeInfo.find(t => t.type === 'Company')
      expect(companyType?.count).toBe(1)
    })

    it('should handle empty graph', () => {
      const graph = new Graphology()
      
      const typeInfo = generateTypeInfo(graph)
      
      expect(typeInfo).toHaveLength(0)
    })
  })

  describe('ensureNonEmptyGraph', () => {
    it('should return original graph if not empty', () => {
      const graph = new Graphology()
      graph.addNode('Person', { color: '#ff0000' })
      
      const result = ensureNonEmptyGraph(graph)
      
      expect(result).toBe(graph)
      expect(result.order).toBe(1)
    })

    it('should create demo graph if empty', () => {
      const graph = new Graphology()
      
      const result = ensureNonEmptyGraph(graph)
      
      expect(result).not.toBe(graph)
      expect(result.order).toBeGreaterThan(0)
      expect(result.hasNode('DemoType')).toBe(true)
    })

    it('should create demo graph with multiple types', () => {
      const graph = new Graphology()
      
      const result = ensureNonEmptyGraph(graph)
      
      expect(result.order).toBeGreaterThan(1)
      expect(result.size).toBeGreaterThan(0)
    })
  })

  describe('schemaToGraph integration', () => {
    it('should convert complete schema to graph', () => {
      const schemaText = `
        type Person {
          name: string @index(exact)
          age: int
          friends: [Person]
          works_at: Company
        }
        
        type Company {
          name: string @index(exact)
          industry: string
          employees: [Person]
        }
      `
      
      const graph = schemaToGraph(schemaText)
      
      expect(graph.order).toBe(2)
      expect(graph.hasNode('Person')).toBe(true)
      expect(graph.hasNode('Company')).toBe(true)
      expect(graph.size).toBeGreaterThan(0)
    })

    it('should handle complex nested relationships', () => {
      const schemaText = `
        type User {
          id: string @id
          username: string @index(exact)
          profile: Profile
          posts: [Post]
          followers: [User]
          following: [User]
        }
        
        type Profile {
          id: string @id
          bio: string
          avatar: string
        }
        
        type Post {
          id: string @id
          title: string
          content: string
          author: User
          comments: [Comment]
        }
        
        type Comment {
          id: string @id
          content: string
          author: User
          post: Post
        }
      `
      
      const graph = schemaToGraph(schemaText)
      
      expect(graph.order).toBe(4)
      expect(graph.hasNode('User')).toBe(true)
      expect(graph.hasNode('Profile')).toBe(true)
      expect(graph.hasNode('Post')).toBe(true)
      expect(graph.hasNode('Comment')).toBe(true)
      expect(graph.size).toBeGreaterThan(0)
    })

    it('should handle schema with predicates', () => {
      const schemaText = `
        name: string @index(exact)
        age: int @index(int)
        email: string @index(exact)
        works_at: uid @reverse
      `
      
      const graph = schemaToGraph(schemaText)
      
      // Should create a demo graph since no types defined
      expect(graph.order).toBeGreaterThan(0)
    })

    it('should handle malformed schema gracefully', () => {
      const malformedSchema = `
        type Person {
          name: string @index(exact)
          age: int
        }
        
        type Company {
          name: string
          # Missing closing brace and field type
      `
      
      const graph = schemaToGraph(malformedSchema)
      
      // Should still create a graph with valid types
      expect(graph.order).toBeGreaterThan(0)
      expect(graph.hasNode('Person')).toBe(true)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle very long type names', () => {
      const schemaText = `
        type VeryLongTypeNameThatExceedsNormalLengthsAndShouldBeHandledGracefully {
          name: string
        }
      `
      
      const graph = schemaToGraph(schemaText)
      
      expect(graph.hasNode('VeryLongTypeNameThatExceedsNormalLengthsAndShouldBeHandledGracefully')).toBe(true)
    })

    it('should handle special characters in type names', () => {
      const schemaText = `
        type "User-Type" {
          name: string
        }
        
        type "Company_Name" {
          name: string
        }
      `
      
      const graph = schemaToGraph(schemaText)
      
      expect(graph.hasNode('User-Type')).toBe(true)
      expect(graph.hasNode('Company_Name')).toBe(true)
    })

    it('should handle schema with only whitespace', () => {
      const schemaText = '   \n  \t  \n  '
      
      const graph = schemaToGraph(schemaText)
      
      // Should create demo graph
      expect(graph.order).toBeGreaterThan(0)
    })

    it('should handle schema with very many types', () => {
      const manyTypes = Array.from({ length: 100 }, (_, i) => `
        type Type${i} {
          id: string @id
          name: string
          related: [Type${(i + 1) % 100}]
        }
      `).join('\n')
      
      const startTime = performance.now()
      const graph = schemaToGraph(manyTypes)
      const endTime = performance.now()
      
      // Should process 100 types in reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500)
      expect(graph.order).toBe(100)
    })
  })
})
