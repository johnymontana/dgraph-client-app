import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import QueryHistory from '../QueryHistory'
import { useDgraph } from '@/context/DgraphContext'

// Mock the DgraphContext
jest.mock('@/context/DgraphContext')
const mockUseDgraph = useDgraph as jest.MockedFunction<typeof useDgraph>

describe('QueryHistory', () => {
  const defaultMockContext = {
    endpoint: '',
    apiKey: '',
    hypermodeRouterKey: '',
    connected: true,
    error: null,
    setEndpoint: jest.fn(),
    setApiKey: jest.fn(),
    setHypermodeRouterKey: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    executeQuery: jest.fn(),
    executeMutation: jest.fn(),
    getSchema: jest.fn(),
    queryHistory: [],
    addToHistory: jest.fn(),
    clearHistory: jest.fn(),
  }

  const mockQueryHistory = [
    { id: '1', query: '{ name }', timestamp: new Date('2023-01-01T10:00:00Z'), result: { data: { q: [] } } },
    { id: '2', query: '{ age }', timestamp: new Date('2023-01-01T11:00:00Z'), result: { data: { q: [] } } },
    { id: '3', query: 'mutation { set: { name: "John" } }', timestamp: new Date('2023-01-01T12:00:00Z'), result: { data: { set: [] } } }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDgraph.mockReturnValue(defaultMockContext)
  })

  describe('rendering', () => {
    it('should render query history component', () => {
      render(<QueryHistory />)
      
      expect(screen.getByText('Query History')).toBeInTheDocument()
    })

    it('should show empty state when no history', () => {
      render(<QueryHistory />)
      
      expect(screen.getByText(/No queries executed yet/i)).toBeInTheDocument()
    })

    it('should show history items when available', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      expect(screen.getByText('{ name }')).toBeInTheDocument()
      expect(screen.getByText('{ age }')).toBeInTheDocument()
      expect(screen.getByText(/mutation { set: { name: "John" } }/)).toBeInTheDocument()
    })

    it('should show clear history button when history exists', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument()
    })
  })

  describe('history item interactions', () => {
    it('should expand/collapse history items when clicked', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      
      // Initially collapsed
      expect(screen.queryByText(/timestamp/i)).not.toBeInTheDocument()
      
      // Click to expand
      fireEvent.click(historyItem)
      expect(screen.getByText(/timestamp/i)).toBeInTheDocument()
      
      // Click to collapse
      fireEvent.click(historyItem)
      expect(screen.queryByText(/timestamp/i)).not.toBeInTheDocument()
    })

    it('should show query details when expanded', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      expect(screen.getByText(/timestamp/i)).toBeInTheDocument()
      expect(screen.getByText(/result/i)).toBeInTheDocument()
      expect(screen.getByText(/copy query/i)).toBeInTheDocument()
    })

    it('should copy query to clipboard when copy button is clicked', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
      Object.assign(navigator, { clipboard: mockClipboard })

      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      const copyButton = screen.getByText(/copy query/i)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('{ name }')
      })
    })

    it('should show success message when query is copied', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
      Object.assign(navigator, { clipboard: mockClipboard })

      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      const copyButton = screen.getByText(/copy query/i)
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(screen.getByText(/query copied to clipboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('history management', () => {
    it('should clear history when clear button is clicked', () => {
      const mockClearHistory = jest.fn()
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory,
        clearHistory: mockClearHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const clearButton = screen.getByRole('button', { name: /clear history/i })
      fireEvent.click(clearButton)
      
      expect(mockClearHistory).toHaveBeenCalled()
    })

    it('should show confirmation dialog before clearing history', () => {
      const mockClearHistory = jest.fn()
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory,
        clearHistory: mockClearHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const clearButton = screen.getByRole('button', { name: /clear history/i })
      fireEvent.click(clearButton)
      
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    })

    it('should confirm clear history when yes button is clicked', () => {
      const mockClearHistory = jest.fn()
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory,
        clearHistory: mockClearHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const clearButton = screen.getByRole('button', { name: /clear history/i })
      fireEvent.click(clearButton)
      
      const confirmButton = screen.getByRole('button', { name: /yes/i })
      fireEvent.click(confirmButton)
      
      expect(mockClearHistory).toHaveBeenCalled()
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })

    it('should cancel clear history when no button is clicked', () => {
      const mockClearHistory = jest.fn()
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory,
        clearHistory: mockClearHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const clearButton = screen.getByRole('button', { name: /clear history/i })
      fireEvent.click(clearButton)
      
      const cancelButton = screen.getByRole('button', { name: /no/i })
      fireEvent.click(cancelButton)
      
      expect(mockClearHistory).not.toHaveBeenCalled()
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })

  describe('query result display', () => {
    it('should display query results when expanded', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      expect(screen.getByText(/result/i)).toBeInTheDocument()
      expect(screen.getByText(/{"data":{"q":\[\]}}/)).toBeInTheDocument()
    })

    it('should handle different result types', () => {
      const historyWithDifferentResults = [
        { ...mockQueryHistory[0], result: { data: { q: [{ name: 'John' }] } } },
        { ...mockQueryHistory[1], result: { errors: ['Query failed'] } }
      ]
      
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: historyWithDifferentResults
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      // Expand first item
      const firstItem = screen.getByText('{ name }')
      fireEvent.click(firstItem)
      expect(screen.getByText(/{"data":{"q":\[{"name":"John"}\]}}/)).toBeInTheDocument()
      
      // Expand second item
      const secondItem = screen.getByText('{ age }')
      fireEvent.click(secondItem)
      expect(screen.getByText(/{"errors":\["Query failed"\]}/)).toBeInTheDocument()
    })
  })

  describe('timestamp formatting', () => {
    it('should format timestamps correctly', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      // Should show formatted timestamp
      expect(screen.getByText(/january 1, 2023/i)).toBeInTheDocument()
    })

    it('should handle different date formats', () => {
      const historyWithDifferentDates = [
        { ...mockQueryHistory[0], timestamp: new Date('2023-12-25T15:30:00Z') }
      ]
      
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: historyWithDifferentDates
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      expect(screen.getByText(/december 25, 2023/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      expect(historyItem).toHaveAttribute('role', 'button')
      expect(historyItem).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update ARIA attributes when expanded', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: [mockQueryHistory[0]]
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      expect(historyItem).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have proper button types', () => {
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: mockQueryHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const clearButton = screen.getByRole('button', { name: /clear history/i })
      expect(clearButton).toHaveAttribute('type', 'button')
    })
  })

  describe('edge cases', () => {
    it('should handle very long queries', () => {
      const longQuery = '{ ' + 'name '.repeat(100) + '}'
      const historyWithLongQuery = [
        { ...mockQueryHistory[0], query: longQuery }
      ]
      
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: historyWithLongQuery
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      expect(screen.getByText(longQuery)).toBeInTheDocument()
    })

    it('should handle queries with special characters', () => {
      const specialQuery = '{ name: "John\'s" age: 30 }'
      const historyWithSpecialChars = [
        { ...mockQueryHistory[0], query: specialQuery }
      ]
      
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: historyWithSpecialChars
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      expect(screen.getByText(specialQuery)).toBeInTheDocument()
    })

    it('should handle empty query results', () => {
      const historyWithEmptyResult = [
        { ...mockQueryHistory[0], result: null }
      ]
      
      const mockContextWithHistory = {
        ...defaultMockContext,
        queryHistory: historyWithEmptyResult
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryHistory />)
      
      const historyItem = screen.getByText('{ name }')
      fireEvent.click(historyItem)
      
      expect(screen.getByText(/no result/i)).toBeInTheDocument()
    })
  })
})
