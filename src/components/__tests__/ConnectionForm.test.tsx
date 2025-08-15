import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import ConnectionForm from '../ConnectionForm'
import { useDgraph } from '@/context/DgraphContext'

// Mock the DgraphContext
jest.mock('@/context/DgraphContext')
const mockUseDgraph = useDgraph as jest.MockedFunction<typeof useDgraph>

describe('ConnectionForm', () => {
  const defaultMockContext = {
    endpoint: '',
    apiKey: '',
    hypermodeRouterKey: '',
    connected: false,
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
    it('should render connection form with all fields', () => {
      render(<ConnectionForm />)
      
      expect(screen.getByText('Dgraph Connection')).toBeInTheDocument()
      expect(screen.getByLabelText(/Dgraph Endpoin/)).toBeInTheDocument()
      expect(screen.getByLabelText(/API Key/)).toBeInTheDocument()
      expect(screen.getByText('Hypermode Settings')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })

    it('should show error message when error exists', () => {
      const mockContextWithError = {
        ...defaultMockContext,
        error: 'Connection failed'
      }
      mockUseDgraph.mockReturnValue(mockContextWithError)

      render(<ConnectionForm />)
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
      expect(screen.getByText('Connection failed')).toHaveClass('bg-red-100')
    })

    it('should show connected state when connected', () => {
      const mockContextConnected = {
        ...defaultMockContext,
        connected: true,
        endpoint: 'http://localhost:8080'
      }
      mockUseDgraph.mockReturnValue(mockContextConnected)

      render(<ConnectionForm />)
      
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
      expect(screen.getByDisplayValue('http://localhost:8080')).toBeDisabled()
    })
  })

  describe('form interactions', () => {
    it('should call setEndpoint when endpoint input changes', () => {
      render(<ConnectionForm />)
      
      const endpointInput = screen.getByLabelText(/Dgraph Endpoin/)
      fireEvent.change(endpointInput, { target: { value: 'http://new-endpoint:8080' } })
      
      expect(defaultMockContext.setEndpoint).toHaveBeenCalledWith('http://new-endpoint:8080')
    })

    it('should call setApiKey when API key input changes', () => {
      render(<ConnectionForm />)
      
      const apiKeyInput = screen.getByLabelText(/API Key/)
      fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } })
      
      expect(defaultMockContext.setApiKey).toHaveBeenCalledWith('new-api-key')
    })

    it('should call setHypermodeRouterKey when hypermode key changes', () => {
      render(<ConnectionForm />)
      
      // Expand hypermode settings
      const hypermodeButton = screen.getByText('Hypermode Settings')
      fireEvent.click(hypermodeButton)
      
      const hypermodeInput = screen.getByLabelText(/Hypermode Router Key/)
      fireEvent.change(hypermodeInput, { target: { value: 'new-hypermode-key' } })
      
      expect(defaultMockContext.setHypermodeRouterKey).toHaveBeenCalledWith('new-hypermode-key')
    })
  })

  describe('connection actions', () => {
    it('should call connect when form is submitted', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined)
      const mockContextWithConnect = {
        ...defaultMockContext,
        connect: mockConnect
      }
      mockUseDgraph.mockReturnValue(mockContextWithConnect)

      render(<ConnectionForm />)
      
      const endpointInput = screen.getByLabelText(/Dgraph Endpoin/)
      fireEvent.change(endpointInput, { target: { value: 'http://localhost:8080' } })
      
      const connectButton = screen.getByRole('button', { name: /connect/i })
      fireEvent.click(connectButton)
      
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled()
      })
    })

    it('should call disconnect when disconnect button is clicked', () => {
      const mockContextConnected = {
        ...defaultMockContext,
        connected: true,
        disconnect: jest.fn()
      }
      mockUseDgraph.mockReturnValue(mockContextConnected)

      render(<ConnectionForm />)
      
      const disconnectButton = screen.getByRole('button', { name: /disconnect/i })
      fireEvent.click(disconnectButton)
      
      expect(mockContextConnected.disconnect).toHaveBeenCalled()
    })

    it('should show loading state during connection', async () => {
      const mockConnect = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      const mockContextWithConnect = {
        ...defaultMockContext,
        connect: mockConnect
      }
      mockUseDgraph.mockReturnValue(mockContextWithConnect)

      render(<ConnectionForm />)
      
      const endpointInput = screen.getByLabelText(/Dgraph Endpoin/)
      fireEvent.change(endpointInput, { target: { value: 'http://localhost:8080' } })
      
      const connectButton = screen.getByRole('button', { name: /connect/i })
      fireEvent.click(connectButton)
      
      // Button should be disabled during loading
      expect(connectButton).toBeDisabled()
      
      await waitFor(() => {
        expect(connectButton).not.toBeDisabled()
      })
    })
  })

  describe('hypermode settings', () => {
    it('should expand/collapse hypermode settings when clicked', () => {
      render(<ConnectionForm />)
      
      const hypermodeButton = screen.getByText('Hypermode Settings')
      
      // Initially collapsed
      expect(screen.queryByLabelText(/Hypermode Router Key/)).not.toBeInTheDocument()
      
      // Click to expand
      fireEvent.click(hypermodeButton)
      expect(screen.getByLabelText(/Hypermode Router Key/)).toBeInTheDocument()
      
      // Click to collapse
      fireEvent.click(hypermodeButton)
      expect(screen.queryByLabelText(/Hypermode Router Key/)).not.toBeInTheDocument()
    })

    it('should show chevron down when collapsed and up when expanded', () => {
      render(<ConnectionForm />)
      
      const hypermodeButton = screen.getByText('Hypermode Settings')
      
      // Initially collapsed - should show chevron down
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument()
      
      // Click to expand - should show chevron up
      fireEvent.click(hypermodeButton)
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('should require endpoint field', () => {
      render(<ConnectionForm />)
      
      const connectButton = screen.getByRole('button', { name: /connect/i })
      fireEvent.click(connectButton)
      
      // Form should not submit without endpoint
      expect(defaultMockContext.connect).not.toHaveBeenCalled()
    })

    it('should allow submission with only endpoint', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined)
      const mockContextWithConnect = {
        ...defaultMockContext,
        connect: mockConnect
      }
      mockUseDgraph.mockReturnValue(mockContextWithConnect)

      render(<ConnectionForm />)
      
      const endpointInput = screen.getByLabelText(/Dgraph Endpoin/)
      fireEvent.change(endpointInput, { target: { value: 'http://localhost:8080' } })
      
      const connectButton = screen.getByRole('button', { name: /connect/i })
      fireEvent.click(connectButton)
      
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<ConnectionForm />)
      
      expect(screen.getByLabelText(/Dgraph Endpoin/)).toBeInTheDocument()
      expect(screen.getByLabelText(/API Key/)).toBeInTheDocument()
    })

    it('should have proper button types', () => {
      render(<ConnectionForm />)
      
      const connectButton = screen.getByRole('button', { name: /connect/i })
      expect(connectButton).toHaveAttribute('type', 'submit')
      
      const hypermodeButton = screen.getByText('Hypermode Settings')
      expect(hypermodeButton).toHaveAttribute('type', 'button')
    })
  })
})
