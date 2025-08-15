import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import SchemaVisualization from '../SchemaVisualization'

// Mock dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: any, options: any) => {
    if (options.loading) {
      return options.loading
    }
    return importFn
  }
}))

// Mock SigmaGraph component
jest.mock('../SigmaGraph', () => {
  return function MockSigmaGraph({ graph }: { graph: any }) {
    return (
      <div data-testid="sigma-graph">
        <div>Graph with {graph?.order || 0} nodes</div>
      </div>
    )
  }
})

// Mock FullscreenToggle component
jest.mock('../FullscreenToggle', () => {
  return function MockFullscreenToggle({ isFullscreen, onToggle }: { isFullscreen: boolean; onToggle: () => void }) {
    return (
      <button data-testid="fullscreen-toggle" onClick={onToggle}>
        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </button>
    )
  }
})

describe('SchemaVisualization', () => {
  const mockSchemaText = `
    type Person {
      name: string @index(exact)
      age: int
      email: string @index(exact)
      friends: [Person]
      works_at: Company
    }
    
    type Company {
      name: string @index(exact)
      industry: string
      employees: [Person]
    }
  `

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render schema visualization component', () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      expect(screen.getByText('Schema Visualization')).toBeInTheDocument()
    })

    it('should show view mode toggle buttons', () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      expect(screen.getByRole('button', { name: /graph/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /json/i })).toBeInTheDocument()
    })

    it('should show fullscreen toggle', () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      expect(screen.getByTestId('fullscreen-toggle')).toBeInTheDocument()
    })
  })

  describe('schema parsing', () => {
    it('should parse valid schema and create graph', async () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('sigma-graph')).toBeInTheDocument()
      })
    })

    it('should show type information legend', async () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      await waitFor(() => {
        expect(screen.getByText('Person')).toBeInTheDocument()
        expect(screen.getByText('Company')).toBeInTheDocument()
      })
    })

    it('should handle empty schema gracefully', () => {
      render(<SchemaVisualization schemaText="" />)
      
      expect(screen.getByText(/No schema defined/i)).toBeInTheDocument()
      expect(screen.getByTestId('sigma-graph')).toBeInTheDocument()
    })

    it('should handle schema with only comments', () => {
      const commentOnlySchema = '# This is a comment\n# Another comment'
      
      render(<SchemaVisualization schemaText={commentOnlySchema} />)
      
      expect(screen.getByText(/No schema defined/i)).toBeInTheDocument()
    })
  })

  describe('view modes', () => {
    it('should start in graph view mode', () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      expect(screen.getByTestId('sigma-graph')).toBeInTheDocument()
      expect(screen.queryByTestId('json-view')).not.toBeInTheDocument()
    })

    it('should switch to JSON view when JSON button is clicked', async () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      const jsonButton = screen.getByRole('button', { name: /json/i })
      fireEvent.click(jsonButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('json-view')).toBeInTheDocument()
        expect(screen.queryByTestId('sigma-graph')).not.toBeInTheDocument()
      })
    })

    it('should switch back to graph view when graph button is clicked', async () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      // Switch to JSON view first
      const jsonButton = screen.getByRole('button', { name: /json/i })
      fireEvent.click(jsonButton)
      
      // Switch back to graph view
      const graphButton = screen.getByRole('button', { name: /graph/i })
      fireEvent.click(graphButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('sigma-graph')).toBeInTheDocument()
        expect(screen.queryByTestId('json-view')).not.toBeInTheDocument()
      })
    })
  })

  describe('fullscreen functionality', () => {
    it('should toggle fullscreen state', () => {
      render(<SchemaVisualization schemaText={mockSchemaText} />)
      
      const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
      
      // Initially not fullscreen
      expect(fullscreenToggle).toHaveTextContent('Enter Fullscreen')
      
      // Click to enter fullscreen
      fireEvent.click(fullscreenToggle)
      expect(fullscreenToggle).toHaveTextContent('Exit Fullscreen')
      
      // Click to exit fullscreen
      fireEvent.click(fullscreenToggle)
      expect(fullscreenToggle).toHaveTextContent('Enter Fullscreen')
    })
  })

  describe('error handling', () => {
    it('should show error message for invalid schema', async () => {
      const invalidSchema = 'type Person { name: string @index(exact)'
      
      render(<SchemaVisualization schemaText={invalidSchema} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Could not generate schema graph/i)).toBeInTheDocument()
      })
    })

    it('should show demo graph when schema parsing fails', async () => {
      const invalidSchema = 'invalid schema syntax'
      
      render(<SchemaVisualization schemaText={invalidSchema} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Could not generate schema graph/i)).toBeInTheDocument()
        expect(screen.getByTestId('sigma-graph')).toBeInTheDocument()
      })
    })
  })

  describe('complex schemas', () => {
    it('should handle schemas with many types', async () => {
      const complexSchema = `
        type User {
          id: string @id
          username: string @index(exact)
          email: string @index(exact)
          profile: Profile
          posts: [Post]
          comments: [Comment]
          followers: [User]
          following: [User]
        }
        
        type Profile {
          id: string @id
          bio: string
          avatar: string
          location: string
          website: string
        }
        
        type Post {
          id: string @id
          title: string @index(term)
          content: string
          author: User
          comments: [Comment]
          tags: [Tag]
          created_at: datetime
          updated_at: datetime
        }
        
        type Comment {
          id: string @id
          content: string
          author: User
          post: Post
          created_at: datetime
        }
        
        type Tag {
          id: string @id
          name: string @index(exact)
          posts: [Post]
        }
      `
      
      render(<SchemaVisualization schemaText={complexSchema} />)
      
      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Post')).toBeInTheDocument()
        expect(screen.getByText('Comment')).toBeInTheDocument()
        expect(screen.getByText('Tag')).toBeInTheDocument()
      })
    })

    it('should handle schemas with directives', async () => {
      const directiveSchema = `
        type Person {
          name: string @index(exact) @lang
          age: int @index(int)
          email: string @index(exact) @upsert
          friends: [Person] @count
          works_at: Company @reverse
        }
        
        type Company {
          name: string @index(exact)
          industry: string @index(term)
          employees: [Person] @reverse
        }
      `
      
      render(<SchemaVisualization schemaText={directiveSchema} />)
      
      await waitFor(() => {
        expect(screen.getByText('Person')).toBeInTheDocument()
        expect(screen.getByText('Company')).toBeInTheDocument()
      })
    })
  })

  describe('performance', () => {
    it('should handle large schemas efficiently', async () => {
      const largeSchema = Array.from({ length: 50 }, (_, i) => `
        type Type${i} {
          id: string @id
          name: string @index(exact)
          field1: string
          field2: int
          field3: float
          field4: bool
          field5: datetime
          related: [Type${(i + 1) % 50}]
        }
      `).join('\n')
      
      const startTime = performance.now()
      render(<SchemaVisualization schemaText={largeSchema} />)
      const endTime = performance.now()
      
      // Should render in reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500)
      
      await waitFor(() => {
        expect(screen.getByTestId('sigma-graph')).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle schema with only whitespace', () => {
      const whitespaceSchema = '   \n  \t  \n  '
      
      render(<SchemaVisualization schemaText={whitespaceSchema} />)
      
      expect(screen.getByText(/No schema defined/i)).toBeInTheDocument()
    })

    it('should handle schema with special characters', async () => {
      const specialCharSchema = `
        type User {
          "user-name": string @index(exact)
          "user_age": int
          "user.email": string @index(exact)
          "user's_bio": string
        }
      `
      
      render(<SchemaVisualization schemaText={specialCharSchema} />)
      
      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument()
      })
    })

    it('should handle schema with very long field names', async () => {
      const longFieldSchema = `
        type Person {
          very_long_field_name_that_exceeds_normal_lengths_and_should_be_handled_gracefully: string
          another_very_long_field_name_with_many_underscores_and_should_not_cause_issues: int
        }
      `
      
      render(<SchemaVisualization schemaText={longFieldSchema} />)
      
      await waitFor(() => {
        expect(screen.getByText('Person')).toBeInTheDocument()
      })
    })
  })
})
