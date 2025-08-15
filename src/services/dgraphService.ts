import axios from 'axios';

interface DgraphConfig {
  endpoint: string;
  apiKey?: string;
  sslMode?: string;
  bearerToken?: string;
}

interface ParsedConnectionString {
  endpoint: string;
  sslMode?: string;
  bearerToken?: string;
}

class DgraphService {
  private config: DgraphConfig;

  constructor(config: DgraphConfig) {
    this.config = config;
  }

  /**
   * Parse a Dgraph connection string
   * Supports formats like:
   * - dgraph://host:port?sslmode=verify-ca&bearertoken=xxx
   * - http://host:port
   * - https://host:port
   */
  static parseConnectionString(connectionString: string): ParsedConnectionString {
    try {
      // Handle dgraph:// protocol
      if (connectionString.startsWith('dgraph://')) {
        // Remove dgraph:// prefix and parse as URL
        const urlString = connectionString.replace('dgraph://', 'https://');
        const url = new URL(urlString);

        return {
          endpoint: `${url.protocol}//${url.host}${url.pathname}`,
          sslMode: url.searchParams.get('sslmode') || undefined,
          bearerToken: url.searchParams.get('bearertoken') || undefined,
        };
      }

      // Handle standard HTTP/HTTPS URLs
      const url = new URL(connectionString);
      return {
        endpoint: `${url.protocol}//${url.host}${url.pathname}`,
        sslMode: url.searchParams.get('sslmode') || undefined,
        bearerToken: url.searchParams.get('bearertoken') || undefined,
      };
    } catch (error) {
      console.error('Error parsing connection string:', error);
      // Fallback: treat as plain endpoint
      return {
        endpoint: connectionString,
      };
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add bearer token if available
    if (this.config.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.bearerToken}`;
    }

    // Add API key if available
    if (this.config.apiKey) {
      headers['X-Dgraph-ApiKey'] = this.config.apiKey;
    }

    return headers;
  }

  private ensureUidAndType(query: string): string {
    // Don't modify special queries like schema {}
    if (query.trim() === 'schema {}' || query.trim().startsWith('schema(')) {
      return query;
    }

    // Don't modify introspection queries that start with "query IntrospectionQuery"
    if (query.trim().startsWith('query IntrospectionQuery')) {
      return query;
    }

    // Process top-level blocks and their nested blocks recursively
    const processBlocksRecursively = (text: string): string => {
      // Define regexes for identifying blocks and field checking
      const blockRegex = /{([^{}]*)}/g;
      const uidRegex = /\buid\b/i;
      const typeRegex = /\bdgraph\.type\b/i;

      // Build a tree of blocks recursively
      const processBlock = (blockText: string): string => {
        // Skip empty blocks or directives/fragments
        if (blockText.trim().length === 0 || blockText.trim().startsWith('@')) {
          return `{${blockText}}`;
        }

        // Check if uid and dgraph.type are already present
        const hasUid = uidRegex.test(blockText);
        const hasType = typeRegex.test(blockText);

        // Start with the original content and add missing fields
        let enhancedContent = blockText;

        // Add uid if not present
        if (!hasUid) {
          enhancedContent = `uid\n${enhancedContent}`;
        }

        // Add dgraph.type if not present
        if (!hasType) {
          enhancedContent = `${enhancedContent}\ndgraph.type`;
        }

        // Look for nested blocks within this block and process them too
        let processedContent = enhancedContent;
        let nestedMatch;
        const nestedRegex = new RegExp(blockRegex);
        let nestedOffset = 0;
        
        while ((nestedMatch = nestedRegex.exec(enhancedContent)) !== null) {
          const matchedNestedBlock = nestedMatch[0];
          const nestedContent = nestedMatch[1];

          // Calculate positions accounting for previous modifications
          const startPos = nestedMatch.index + nestedOffset;
          const endPos = startPos + matchedNestedBlock.length;

          // Process this nested block
          const processedNestedBlock = processBlock(nestedContent);

          // Replace in the string
          processedContent = processedContent.substring(0, startPos) +
                             processedNestedBlock +
                             processedContent.substring(endPos);

          // Update offset for future replacements
          nestedOffset += (processedNestedBlock.length - matchedNestedBlock.length);

          // Update regex lastIndex
          nestedRegex.lastIndex = startPos + processedNestedBlock.length;
        }
        
        return `{${processedContent}}`;
      };

      // Find all top-level blocks
      let processedText = text;
      let match;
      const regex = new RegExp(blockRegex);
      let offset = 0;

      while ((match = regex.exec(text)) !== null) {
        const matchedBlock = match[0];
        const blockContent = match[1];

        // Calculate positions accounting for previous modifications
        const startPos = match.index + offset;
        const endPos = startPos + matchedBlock.length;
        
        // Process this block and all its nested blocks
        const processedBlock = processBlock(blockContent);

        // Replace in the string
        processedText = processedText.substring(0, startPos) +
                        processedBlock +
                        processedText.substring(endPos);

        // Update offset for future replacements
        offset += (processedBlock.length - matchedBlock.length);

        // Update regex lastIndex
        regex.lastIndex = startPos + processedBlock.length;
      }
      
      return processedText;
    };

    // Process the entire query with recursive block enhancement
    return processBlocksRecursively(query);
  }

  async query(query: string, variables?: Record<string, any>) {
    try {
      // Special handling for schema queries
      if (query.trim() === 'schema {}' || query.trim().startsWith('schema(')) {
        const response = await axios.post(
          `${this.config.endpoint}/query`,
          { query, variables },
          { headers: this.getHeaders() }
        );
        return response.data;
      }

      // Modify the query to ensure uid and dgraph.type are included
      const enhancedQuery = this.ensureUidAndType(query);

      // Log the differences if query was modified
      if (enhancedQuery !== query) {
        console.log('Query was enhanced to include uid and dgraph.type predicates');
        console.log('Original query:', query);
        console.log('Enhanced query:', enhancedQuery);
      }

      const response = await axios.post(
        `${this.config.endpoint}/query`,
        {
          query: enhancedQuery,
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

  async mutate(mutation: string, variables?: Record<string, any>) {
    try {
      const response = await axios.post(
        `${this.config.endpoint}/mutate`,
        {
          mutation,
          variables,
          commitNow: true // Automatically commit the transaction
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error executing mutation:', error);
      throw error;
    }
  }
}

export default DgraphService;
