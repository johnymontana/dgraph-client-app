import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { DgraphProvider } from '@/context/DgraphContext'

// Mock the DgraphContext for testing
const mockDgraphContext = {
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

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DgraphProvider>
      {children}
    </DgraphProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Export mock context for testing
export { mockDgraphContext }

// Helper function to create mock Dgraph response
export const createMockDgraphResponse = (data: any, errors?: any[]) => ({
  data,
  errors,
  extensions: {},
})

// Helper function to create mock schema
export const createMockSchema = () => ({
  types: [
    {
      name: 'Person',
      fields: [
        { name: 'uid', type: 'ID!' },
        { name: 'name', type: 'String!' },
        { name: 'age', type: 'Int' },
      ],
    },
    {
      name: 'Company',
      fields: [
        { name: 'uid', type: 'ID!' },
        { name: 'name', type: 'String!' },
        { name: 'industry', type: 'String' },
      ],
    },
  ],
})

// Helper function to create mock query result
export const createMockQueryResult = () => ({
  data: {
    q: [
      {
        uid: '0x1',
        name: 'John Doe',
        age: 30,
        dgraph_type: ['Person'],
      },
      {
        uid: '0x2',
        name: 'Jane Smith',
        age: 25,
        dgraph_type: ['Person'],
      },
    ],
  },
})

// Helper function to create mock mutation result
export const createMockMutationResult = () => ({
  data: {
    set: [
      {
        uid: '_:new',
        name: 'New Person',
        age: 35,
        dgraph_type: ['Person'],
      },
    ],
  },
})
