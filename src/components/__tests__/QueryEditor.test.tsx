import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import QueryEditor from '../QueryEditor'
import { useDgraph } from '@/context/DgraphContext'

// Mock the DgraphContext
jest.mock('@/context/DgraphContext')
const mockUseDgraph = useDgraph as jest.MockedFunction<typeof useDgraph>

// Mock CodeMirror
jest.mock('@uiw/react-codemirror', () => {
  return function MockCodeMirror({ value, onChange, ...props }: any) {
    return (
      <textarea
        data-testid="codemirror"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...props}
      />
    )
  }
})

describe('QueryEditor', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDgraph.mockReturnValue(defaultMockContext)
  })

  describe('rendering', () => {
    it('should render query editor with all controls', () => {
      render(<QueryEditor />)
      
      expect(screen.getByText('Query Editor')).toBeInTheDocument()
      expect(screen.getByTestId('codemirror')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
      expect(screen.getByText('Variables')).toBeInTheDocument()
    })

    it('should show disconnected message when not connected', () => {
      const mockContextDisconnected = {
        ...defaultMockContext,
        connected: false
      }
      mockUseDgraph.mockReturnValue(mockContextDisconnected)

      render(<QueryEditor />)
      
      expect(screen.getByText(/Please connect to a Dgraph instance first/i)).toBeInTheDocument()
    })

    it('should show error message when error exists', () => {
      const mockContextWithError = {
        ...defaultMockContext,
        error: 'Query execution failed'
      }
      mockUseDgraph.mockReturnValue(mockContextWithError)

      render(<QueryEditor />)
      
      expect(screen.getByText('Query execution failed')).toBeInTheDocument()
    })
  })

  describe('query execution', () => {
    it('should execute query when execute button is clicked', async () => {
      const mockExecuteQuery = jest.fn().mockResolvedValue({ data: { q: [] } })
      const mockContextWithExecute = {
        ...defaultMockContext,
        executeQuery: mockExecuteQuery
      }
      mockUseDgraph.mockReturnValue(mockContextWithExecute)

      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: '{ name }' } })
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(mockExecuteQuery).toHaveBeenCalledWith('{ name }')
      })
    })

    it('should execute mutation when mutation button is clicked', async () => {
      const mockExecuteMutation = jest.fn().mockResolvedValue({ data: { set: [] } })
      const mockContextWithMutation = {
        ...defaultMockContext,
        executeMutation: mockExecuteMutation
      }
      mockUseDgraph.mockReturnValue(mockContextWithMutation)

      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: '{ set: { name: "John" } }' } })
      
      const mutationButton = screen.getByRole('button', { name: /mutation/i })
      fireEvent.click(mutationButton)
      
      await waitFor(() => {
        expect(mockExecuteMutation).toHaveBeenCalledWith({ set: { name: "John" } })
      })
    })

    it('should add query to history after execution', async () => {
      const mockExecuteQuery = jest.fn().mockResolvedValue({ data: { q: [] } })
      const mockAddToHistory = jest.fn()
      const mockContextWithHistory = {
        ...defaultMockContext,
        executeQuery: mockExecuteQuery,
        addToHistory: mockAddToHistory
      }
      mockUseDgraph.mockReturnValue(mockContextWithHistory)

      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: '{ name }' } })
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(mockAddToHistory).toHaveBeenCalledWith('{ name }')
      })
    })

    it('should show loading state during execution', async () => {
      const mockExecuteQuery = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      const mockContextWithExecute = {
        ...defaultMockContext,
        executeQuery: mockExecuteQuery
      }
      mockUseDgraph.mockReturnValue(mockContextWithExecute)

      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: '{ name }' } })
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      fireEvent.click(executeButton)
      
      // Button should be disabled during loading
      expect(executeButton).toBeDisabled()
      
      await waitFor(() => {
        expect(executeButton).not.toBeDisabled()
      })
    })
  })

  describe('query input', () => {
    it('should update query value when typing', () => {
      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: 'new query' } })
      
      expect(queryInput).toHaveValue('new query')
    })

    it('should clear query when clear button is clicked', () => {
      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: 'some query' } })
      
      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)
      
      expect(queryInput).toHaveValue('')
    })

    it('should detect GraphQL mutations automatically', () => {
      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: 'mutation { set: { name: "John" } }' } })
      
      // Should show mutation button as primary
      const mutationButton = screen.getByRole('button', { name: /mutation/i })
      expect(mutationButton).toHaveClass('bg-blue-600')
    })
  })

  describe('variables handling', () => {
    it('should show variables section', () => {
      render(<QueryEditor />)
      
      expect(screen.getByText('Variables')).toBeInTheDocument()
    })

    it('should add variable when add variable button is clicked', () => {
      render(<QueryEditor />)
      
      const addVariableButton = screen.getByRole('button', { name: /add variable/i })
      fireEvent.click(addVariableButton)
      
      // Should show variable input fields
      expect(screen.getByPlaceholderText('Variable name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Variable value')).toBeInTheDocument()
    })

    it('should remove variable when remove button is clicked', () => {
      render(<QueryEditor />)
      
      // Add a variable first
      const addVariableButton = screen.getByRole('button', { name: /add variable/i })
      fireEvent.click(addVariableButton)
      
      // Remove it
      const removeButton = screen.getByRole('button', { name: /remove/i })
      fireEvent.click(removeButton)
      
      // Variable fields should be gone
      expect(screen.queryByPlaceholderText('Variable name')).not.toBeInTheDocument()
    })
  })

  describe('query validation', () => {
    it('should not execute empty queries', () => {
      render(<QueryEditor />)
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      fireEvent.click(executeButton)
      
      expect(defaultMockContext.executeQuery).not.toHaveBeenCalled()
    })

    it('should not execute queries with only whitespace', () => {
      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: '   ' } })
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      fireEvent.click(executeButton)
      
      expect(defaultMockContext.executeQuery).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should show execution errors', async () => {
      const mockExecuteQuery = jest.fn().mockRejectedValue(new Error('Query failed'))
      const mockContextWithError = {
        ...defaultMockContext,
        executeQuery: mockExecuteQuery
      }
      mockUseDgraph.mockReturnValue(mockContextWithError)

      render(<QueryEditor />)
      
      const queryInput = screen.getByTestId('codemirror')
      fireEvent.change(queryInput, { target: { value: '{ invalid }' } })
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(screen.getByText(/query failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper labels and roles', () => {
      render(<QueryEditor />)
      
      expect(screen.getByText('Query Editor')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('should have proper button states', () => {
      render(<QueryEditor />)
      
      const executeButton = screen.getByRole('button', { name: /execute/i })
      expect(executeButton).toBeEnabled()
      
      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).toBeEnabled()
    })
  })
})
