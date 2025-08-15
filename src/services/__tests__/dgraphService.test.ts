import { DgraphService } from '../dgraphService'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('DgraphService', () => {
  let service: DgraphService
  const mockConfig = {
    endpoint: 'http://localhost:8080',
    apiKey: 'test-api-key'
  }

  beforeEach(() => {
    service = new DgraphService(mockConfig)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create service with config', () => {
      expect(service).toBeInstanceOf(DgraphService)
    })
  })

  describe('getHeaders', () => {
    it('should return headers with API key when provided', () => {
      const headers = (service as any).getHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['X-Dgraph-ApiKey']).toBe('test-api-key')
    })

    it('should return headers without API key when not provided', () => {
      const serviceWithoutKey = new DgraphService({ endpoint: 'http://localhost:8080' })
      const headers = (serviceWithoutKey as any).getHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['X-Dgraph-ApiKey']).toBeUndefined()
    })
  })

  describe('ensureUidAndType', () => {
    it('should not modify schema queries', () => {
      const query = 'schema {}'
      const result = (service as any).ensureUidAndType(query)
      expect(result).toBe(query)
    })

    it('should not modify introspection queries', () => {
      const query = 'query IntrospectionQuery { __schema { types { name } } }'
      const result = (service as any).ensureUidAndType(query)
      expect(result).toBe(query)
    })

    it('should add uid and dgraph.type to simple queries', () => {
      const query = '{ name }'
      const result = (service as any).ensureUidAndType(query)
      expect(result).toContain('uid')
      expect(result).toContain('dgraph.type')
      expect(result).toContain('name')
    })

    it('should not duplicate existing uid and dgraph.type', () => {
      const query = '{ uid name dgraph.type }'
      const result = (service as any).ensureUidAndType(query)
      expect(result).toBe(query)
    })

    it('should handle nested blocks correctly', () => {
      const query = '{ name friends { name } }'
      const result = (service as any).ensureUidAndType(query)
      expect(result).toContain('uid')
      expect(result).toContain('dgraph.type')
      expect(result).toContain('friends')
    })

    it('should handle complex nested structures', () => {
      const query = '{ name friends { name age } companies { name industry } }'
      const result = (service as any).ensureUidAndType(query)
      expect(result).toContain('uid')
      expect(result).toContain('dgraph.type')
      expect(result).toContain('friends')
      expect(result).toContain('companies')
    })
  })

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockResponse = { data: { q: [{ name: 'John' }] } }
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await service.executeQuery('{ name }')
      expect(result).toEqual(mockResponse.data)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/query',
        { query: '{ uid\nname\ndgraph.type }' },
        { headers: { 'Content-Type': 'application/json', 'X-Dgraph-ApiKey': 'test-api-key' } }
      )
    })

    it('should handle query errors', async () => {
      const mockError = new Error('Network error')
      mockedAxios.post.mockRejectedValueOnce(mockError)

      await expect(service.executeQuery('{ invalid }')).rejects.toThrow('Network error')
    })
  })

  describe('executeMutation', () => {
    it('should execute mutation successfully', async () => {
      const mockResponse = { data: { set: [{ uid: '_:new' }] } }
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const mutation = { set: [{ name: 'John' }] }
      const result = await service.executeMutation(mutation)
      expect(result).toEqual(mockResponse.data)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/mutate',
        mutation,
        { headers: { 'Content-Type': 'application/json', 'X-Dgraph-ApiKey': 'test-api-key' } }
      )
    })

    it('should handle mutation errors', async () => {
      const mockError = new Error('Mutation failed')
      mockedAxios.post.mockRejectedValueOnce(mockError)

      const mutation = { set: [{ name: 'John' }] }
      await expect(service.executeMutation(mutation)).rejects.toThrow('Mutation failed')
    })
  })

  describe('getSchema', () => {
    it('should fetch schema successfully', async () => {
      const mockResponse = { data: { schema: { types: [] } } }
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await service.getSchema()
      expect(result).toEqual(mockResponse.data)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/query',
        { query: 'schema {}' },
        { headers: { 'Content-Type': 'application/json', 'X-Dgraph-ApiKey': 'test-api-key' } }
      )
    })

    it('should handle schema fetch errors', async () => {
      const mockError = new Error('Schema fetch failed')
      mockedAxios.post.mockRejectedValueOnce(mockError)

      await expect(service.getSchema()).rejects.toThrow('Schema fetch failed')
    })
  })

  describe('healthCheck', () => {
    it('should return true for healthy endpoint', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200 })

      const result = await service.healthCheck()
      expect(result).toBe(true)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8080/health',
        { headers: { 'X-Dgraph-ApiKey': 'test-api-key' } }
      )
    })

    it('should return false for unhealthy endpoint', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection failed'))

      const result = await service.healthCheck()
      expect(result).toBe(false)
    })
  })
})
