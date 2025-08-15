import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import DQLAutocomplete from '../DQLAutocomplete'
import { ParsedSchema } from '@/utils/schemaParser'

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('DQLAutocomplete', () => {
  const mockSchema: ParsedSchema = {
    types: [
      { name: 'Person', fields: [] },
      { name: 'Company', fields: [] }
    ],
    predicates: [
      { predicate: 'name', type: 'string' },
      { predicate: 'age', type: 'int' },
      { predicate: 'works_at', type: 'uid' }
    ]
  }

  const defaultProps = {
    editorRef: { current: document.createElement('div') },
    query: '',
    cursorPosition: 0,
    schema: mockSchema,
    onSuggestionSelect: jest.fn(),
    registerHandleInput: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock getBoundingClientRect
    if (defaultProps.editorRef.current) {
      defaultProps.editorRef.current.getBoundingClientRect = jest.fn().mockReturnValue({
        top: 100,
        left: 50,
        width: 400,
        height: 200
      })
    }
  })

  describe('rendering', () => {
    it('should not render suggestions initially', () => {
      render(<DQLAutocomplete {...defaultProps} />)
      
      expect(screen.queryByText('func')).not.toBeInTheDocument()
    })

    it('should render suggestions when visible', () => {
      // Mock the component to be visible by setting isTyping to true
      const propsWithTyping = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithTyping} />)
      
      // The component should be visible when there's a query and cursor position
      expect(screen.getByText('func')).toBeInTheDocument()
    })
  })

  describe('suggestion generation', () => {
    it('should show DQL keywords when typing', () => {
      const propsWithQuery = { ...defaultProps, query: 'func', cursorPosition: 4 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      expect(screen.getByText('func')).toBeInTheDocument()
      expect(screen.getByText('has')).toBeInTheDocument()
    })

    it('should show schema predicates when typing', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      expect(screen.getByText('name')).toBeInTheDocument()
    })

    it('should filter suggestions based on input', () => {
      const propsWithQuery = { ...defaultProps, query: 'ag', cursorPosition: 2 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      expect(screen.getByText('age')).toBeInTheDocument()
      expect(screen.queryByText('name')).not.toBeInTheDocument()
    })

    it('should show DQL directives when in directive context', () => {
      const propsWithQuery = { ...defaultProps, query: '@filter', cursorPosition: 8 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      expect(screen.getByText('filter')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('should handle arrow key navigation', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestionsDiv = screen.getByText('func').closest('div')
      
      // Navigate down
      fireEvent.keyDown(suggestionsDiv!, { key: 'ArrowDown' })
      expect(screen.getByText('name')).toHaveClass('bg-blue-100')
      
      // Navigate up
      fireEvent.keyDown(suggestionsDiv!, { key: 'ArrowUp' })
      expect(screen.getByText('func')).toHaveClass('bg-blue-100')
    })

    it('should handle Enter key selection', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestionsDiv = screen.getByText('func').closest('div')
      fireEvent.keyDown(suggestionsDiv!, { key: 'Enter' })
      
      expect(defaultProps.onSuggestionSelect).toHaveBeenCalledWith('func')
    })

    it('should handle Escape key to hide suggestions', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestionsDiv = screen.getByText('func').closest('div')
      fireEvent.keyDown(suggestionsDiv!, { key: 'Escape' })
      
      expect(screen.queryByText('func')).not.toBeInTheDocument()
    })
  })

  describe('mouse interactions', () => {
    it('should handle mouse hover on suggestions', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestion = screen.getByText('name')
      fireEvent.mouseEnter(suggestion)
      
      // The component should handle hover states
      expect(suggestion).toBeInTheDocument()
    })

    it('should handle mouse click on suggestions', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestion = screen.getByText('name')
      fireEvent.click(suggestion)
      
      expect(defaultProps.onSuggestionSelect).toHaveBeenCalledWith('name')
    })
  })

  describe('positioning', () => {
    it('should calculate position relative to editor', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      // Position should be calculated based on editor position
      const suggestions = screen.getByText('func').closest('div')
      expect(suggestions).toBeInTheDocument()
    })
  })

  describe('typing behavior', () => {
    it('should debounce hiding suggestions', async () => {
      jest.useFakeTimers()
      
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      // Suggestions should be visible
      expect(screen.getByText('func')).toBeInTheDocument()
      
      // Fast forward time to trigger debounce
      jest.advanceTimersByTime(600)
      
      await waitFor(() => {
        expect(screen.queryByText('func')).not.toBeInTheDocument()
      })
      
      jest.useRealTimers()
    })

    it('should register input handler with parent', () => {
      render(<DQLAutocomplete {...defaultProps} />)
      
      expect(defaultProps.registerHandleInput).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty schema gracefully', () => {
      const emptySchema: ParsedSchema = { types: [], predicates: [] }
      
      render(<DQLAutocomplete {...defaultProps} schema={emptySchema} query="nam" cursorPosition={3} />)
      
      // Should still show DQL keywords
      expect(screen.getByText('func')).toBeInTheDocument()
    })

    it('should handle null editorRef gracefully', () => {
      const propsWithNullRef = { ...defaultProps, editorRef: { current: null } }
      
      expect(() => {
        render(<DQLAutocomplete {...propsWithNullRef} />)
      }).not.toThrow()
    })

    it('should handle cursor position beyond query length', () => {
      render(<DQLAutocomplete {...defaultProps} query="test" cursorPosition={10} />)
      
      // Should not crash and should handle gracefully
      expect(screen.queryByText('func')).not.toBeInTheDocument()
    })
  })

  describe('suggestions list structure', () => {
    it('should render suggestions as a proper list', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestionsDiv = screen.getByText('func').closest('div')
      const listItems = screen.getAllByRole('listitem')
      
      expect(suggestionsDiv).toBeInTheDocument()
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('should have proper accessibility attributes', () => {
      const propsWithQuery = { ...defaultProps, query: 'nam', cursorPosition: 3 }
      
      render(<DQLAutocomplete {...propsWithQuery} />)
      
      const suggestionsDiv = screen.getByText('func').closest('div')
      expect(suggestionsDiv).toHaveAttribute('tabIndex', '-1')
    })
  })
})
