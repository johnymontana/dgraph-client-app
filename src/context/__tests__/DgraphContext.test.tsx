import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { DgraphProvider, useDgraph } from '../DgraphContext'
import { DgraphService } from '@/services/dgraphService'

// Mock the DgraphService
jest.mock('@/services/dgraphService')
const MockDgraphService = DgraphService as jest.MockedClass<typeof DgraphService>

// Mock axios
jest.mock('axios')

describe('DgraphContext', () => {
  const mockExecuteQuery = jest.fn()
  const mockExecuteMutation = jest.fn()
  const mockGetSchema = jest.fn()
  const mockHealthCheck = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    MockDgraphService.mockImplementation(() => ({
      executeQuery: mockExecuteQuery,
      executeMutation: mockExecuteMutation,
      getSchema: mockGetSchema,
      healthCheck: mockHealthCheck,
    } as any))
  })

  const TestComponent = () => {
    const context = useDgraph()
    return (
      <div>
        <div data-testid="endpoint">{context.endpoint}</div>
        <div data-testid="connected">{context.connected.toString()}</div>
        <div data-testid="error">{context.error || 'no-error'}</div>
        <button onClick={() => context.setEndpoint('test')}>Set Endpoint</button>
        <button onClick={() => context.connect()}>Connect</button>
        <button onClick={() => context.disconnect()}>Disconnect</button>
      </div>
    )
  }

  describe('DgraphProvider', () => {
    it('should provide context to children', () => {
      render(
        <DgraphProvider>
          <TestComponent />
        </DgraphProvider>
      )

      expect(screen.getByTestId('endpoint')).toBeInTheDocument()
      expect(screen.getByTestId('connected')).toBeInTheDocument()
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    it('should initialize with default values', () => {
      render(
        <DgraphProvider>
          <TestComponent />
        </DgraphProvider>
      )

      expect(screen.getByTestId('endpoint')).toHaveTextContent('')
      expect(screen.getByTestId('connected')).toHaveTextContent('false')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })
  })

  describe('useDgraph hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => render(<TestComponent />)).toThrow(
        'useDgraph must be used within a DgraphProvider'
      )
      
      consoleSpy.mockRestore()
    })

    it('should provide all required context values', () => {
      render(
        <DgraphProvider>
          <TestComponent />
        </DgraphProvider>
      )

      const context = useDgraph()
      
      expect(context).toHaveProperty('endpoint')
      expect(context).toHaveProperty('apiKey')
      expect(context).toHaveProperty('hypermodeRouterKey')
      expect(context).toHaveProperty('connected')
      expect(context).toHaveProperty('error')
      expect(context).toHaveProperty('setEndpoint')
      expect(context).toHaveProperty('setApiKey')
      expect(context).toHaveProperty('setHypermodeRouterKey')
      expect(context).toHaveProperty('connect')
      expect(context).toHaveProperty('disconnect')
      expect(context).toHaveProperty('executeQuery')
      expect(context).toHaveProperty('executeMutation')
      expect(context).toHaveProperty('getSchema')
      expect(context).toHaveProperty('queryHistory')
      expect(context).toHaveProperty('addToHistory')
      expect(context).toHaveProperty('clearHistory')
    })
  })

  describe('context state management', () => {
    it('should update endpoint when setEndpoint is called', () => {
      render(
        <DgraphProvider>
          <TestComponent />
        </DgraphProvider>
      )

      const setEndpointButton = screen.getByText('Set Endpoint')
      fireEvent.click(setEndpointButton)

      expect(screen.getByTestId('endpoint')).toHaveTextContent('test')
    })

    it('should update API key when setApiKey is called', () => {
      const TestComponentWithApiKey = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="apiKey">{context.apiKey}</div>
            <button onClick={() => context.setApiKey('test-key')}>Set API Key</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithApiKey />
        </DgraphProvider>
      )

      const setApiKeyButton = screen.getByText('Set API Key')
      fireEvent.click(setApiKeyButton)

      expect(screen.getByTestId('apiKey')).toHaveTextContent('test-key')
    })

    it('should update hypermode router key when setHypermodeRouterKey is called', () => {
      const TestComponentWithHypermode = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="hypermodeKey">{context.hypermodeRouterKey}</div>
            <button onClick={() => context.setHypermodeRouterKey('test-hypermode')}>Set Hypermode Key</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithHypermode />
        </DgraphProvider>
      )

      const setHypermodeButton = screen.getByText('Set Hypermode Key')
      fireEvent.click(setHypermodeButton)

      expect(screen.getByTestId('hypermodeKey')).toHaveTextContent('test-hypermode')
    })
  })

  describe('connection management', () => {
    it('should connect successfully when valid endpoint is provided', async () => {
      mockHealthCheck.mockResolvedValue(true)
      mockGetSchema.mockResolvedValue({ types: [] })

      const TestComponentWithConnection = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="connected">{context.connected.toString()}</div>
            <button onClick={() => context.setEndpoint('http://localhost:8080')}>Set Endpoint</button>
            <button onClick={() => context.connect()}>Connect</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithConnection />
        </DgraphProvider>
      )

      const setEndpointButton = screen.getByText('Set Endpoint')
      const connectButton = screen.getByText('Connect')

      fireEvent.click(setEndpointButton)
      fireEvent.click(connectButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('connected')).toHaveTextContent('true')
    })

    it('should handle connection errors', async () => {
      mockHealthCheck.mockRejectedValue(new Error('Connection failed'))

      const TestComponentWithError = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="error">{context.error || 'no-error'}</div>
            <button onClick={() => context.setEndpoint('http://invalid:8080')}>Set Endpoint</button>
            <button onClick={() => context.connect()}>Connect</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithError />
        </DgraphProvider>
      )

      const setEndpointButton = screen.getByText('Set Endpoint')
      const connectButton = screen.getByText('Connect')

      fireEvent.click(setEndpointButton)
      fireEvent.click(connectButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Connection failed')
    })

    it('should disconnect successfully', () => {
      const TestComponentWithDisconnect = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="connected">{context.connected.toString()}</div>
            <button onClick={() => context.disconnect()}>Disconnect</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithDisconnect />
        </DgraphProvider>
      )

      const disconnectButton = screen.getByText('Disconnect')
      fireEvent.click(disconnectButton)

      expect(screen.getByTestId('connected')).toHaveTextContent('false')
    })
  })

  describe('query execution', () => {
    it('should execute queries successfully', async () => {
      mockExecuteQuery.mockResolvedValue({ data: { q: [] } })

      const TestComponentWithQuery = () => {
        const context = useDgraph()
        const [result, setResult] = React.useState('')
        
        const executeQuery = async () => {
          try {
            const queryResult = await context.executeQuery('{ name }')
            setResult(JSON.stringify(queryResult))
          } catch (error) {
            setResult('error')
          }
        }

        return (
          <div>
            <div data-testid="result">{result}</div>
            <button onClick={executeQuery}>Execute Query</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithQuery />
        </DgraphProvider>
      )

      const executeButton = screen.getByText('Execute Query')
      fireEvent.click(executeButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('result')).toHaveTextContent('{"data":{"q":[]}}')
    })

    it('should execute mutations successfully', async () => {
      mockExecuteMutation.mockResolvedValue({ data: { set: [] } })

      const TestComponentWithMutation = () => {
        const context = useDgraph()
        const [result, setResult] = React.useState('')
        
        const executeMutation = async () => {
          try {
            const mutationResult = await context.executeMutation({ set: { name: 'John' } })
            setResult(JSON.stringify(mutationResult))
          } catch (error) {
            setResult('error')
          }
        }

        return (
          <div>
            <div data-testid="result">{result}</div>
            <button onClick={executeMutation}>Execute Mutation</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithMutation />
        </DgraphProvider>
      )

      const executeButton = screen.getByText('Execute Mutation')
      fireEvent.click(executeButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('result')).toHaveTextContent('{"data":{"set":[]}}')
    })
  })

  describe('query history', () => {
    it('should add queries to history', () => {
      const TestComponentWithHistory = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="historyCount">{context.queryHistory.length}</div>
            <button onClick={() => context.addToHistory('{ name }')}>Add to History</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithHistory />
        </DgraphProvider>
      )

      const addButton = screen.getByText('Add to History')
      fireEvent.click(addButton)

      expect(screen.getByTestId('historyCount')).toHaveTextContent('1')
    })

    it('should clear query history', () => {
      const TestComponentWithClearHistory = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="historyCount">{context.queryHistory.length}</div>
            <button onClick={() => context.addToHistory('{ name }')}>Add to History</button>
            <button onClick={() => context.clearHistory()}>Clear History</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithClearHistory />
        </DgraphProvider>
      )

      const addButton = screen.getByText('Add to History')
      const clearButton = screen.getByText('Clear History')

      fireEvent.click(addButton)
      expect(screen.getByTestId('historyCount')).toHaveTextContent('1')

      fireEvent.click(clearButton)
      expect(screen.getByTestId('historyCount')).toHaveTextContent('0')
    })
  })

  describe('error handling', () => {
    it('should clear errors when new connection is attempted', async () => {
      mockHealthCheck.mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(true)
      mockGetSchema.mockResolvedValue({ types: [] })

      const TestComponentWithErrorHandling = () => {
        const context = useDgraph()
        return (
          <div>
            <div data-testid="error">{context.error || 'no-error'}</div>
            <button onClick={() => context.setEndpoint('http://localhost:8080')}>Set Endpoint</button>
            <button onClick={() => context.connect()}>Connect</button>
          </div>
        )
      }

      render(
        <DgraphProvider>
          <TestComponentWithErrorHandling />
        </DgraphProvider>
      )

      const setEndpointButton = screen.getByText('Set Endpoint')
      const connectButton = screen.getByText('Connect')

      // First connection attempt - should fail
      fireEvent.click(setEndpointButton)
      fireEvent.click(connectButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('First error')

      // Second connection attempt - should succeed and clear error
      fireEvent.click(connectButton)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })
  })
})
