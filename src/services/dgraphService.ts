import axios from 'axios';

interface DgraphConfig {
  endpoint: string;
  apiKey?: string;
}

class DgraphService {
  private config: DgraphConfig;

  constructor(config: DgraphConfig) {
    this.config = config;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-Dgraph-ApiKey'] = this.config.apiKey;
    }

    return headers;
  }

  async query(query: string, variables?: Record<string, any>) {
    try {
      const response = await axios.post(
        `${this.config.endpoint}/query`,
        {
          query,
          variables,
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async alter(schema: string) {
    try {
      const response = await axios.post(
        `${this.config.endpoint}/alter`,
        { schema },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error altering schema:', error);
      throw error;
    }
  }

  async getSchema() {
    try {
      const result = await this.query(`schema {}`);
      return result;
    } catch (error) {
      console.error('Error fetching schema:', error);
      throw error;
    }
  }
}

export default DgraphService;
