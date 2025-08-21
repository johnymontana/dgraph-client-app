import axios from 'axios';
import { Agent } from 'https';

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
      console.log('Parsing connection string:', connectionString);

      // Handle dgraph:// protocol
      if (connectionString.startsWith('dgraph://')) {
        // Remove dgraph:// prefix and parse as URL
        const urlString = connectionString.replace('dgraph://', 'https://');
        console.log('Converted to URL string:', urlString);

        const url = new URL(urlString);
        console.log('Parsed URL:', {
          protocol: url.protocol,
          host: url.host,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          searchParams: Object.fromEntries(url.searchParams.entries())
        });

        // For port 443, don't include it in the endpoint as it's the default HTTPS port
        const host = url.port === '443' ? url.hostname : url.host;
        // Ensure we don't have double slashes by handling pathname properly
        const pathname = url.pathname === '/' ? '' : url.pathname;
        const endpoint = `${url.protocol}//${host}${pathname}`;

        console.log('Final endpoint:', endpoint);

        return {
          endpoint,
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

  private getEndpoint(path: string): string {
    // For development, optionally use a CORS proxy
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_CORS_PROXY === 'true') {
      const corsProxy = process.env.NEXT_PUBLIC_CORS_PROXY || 'https://cors-anywhere.herokuapp.com/';
      const fullEndpoint = `${corsProxy}${this.config.endpoint}${path}`;
      console.log('Using CORS proxy. Full endpoint:', fullEndpoint);
      return fullEndpoint;
    }
    console.log('Not using CORS proxy. Direct endpoint:', `${this.config.endpoint}${path}`);
    return `${this.config.endpoint}${path}`;
  }

  private getDgraphPath(path: string): string {
    // Dgraph endpoints should use /dgraph prefix
    return `/dgraph${path}`;
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

  async vectorQuery(query: string, embedding: number[], variables?: Record<string, any>) {
    const vectorVariables = {
      ...variables,
      queryVector: embedding
    };
    return this.query(query, vectorVariables);
  }

  async getSchemaData() {
    const schemaQuery = `{
      # Variable block to collect all typed nodes
      var(func: has(dgraph.type)) {
        all_typed_nodes as uid
      }
      
      # 1. GET ALL UNIQUE NODE TYPES WITH COUNTS
      node_type_counts(func: has(dgraph.type)) @groupby(dgraph.type) {
        count(uid)
      }
      
      # 2. COMPLETE SCHEMA DISCOVERY - No hardcoded predicates
      schema_discovery(func: uid(all_typed_nodes), first: 100) {
        node_type: dgraph.type
        node_uid: uid
        
        # Expand ALL predicates dynamically - captures everything
        expand(_all_) {
          # For any connected nodes, get their type to map relationships
          relationship_target_type: dgraph.type
        }
      }
    }`;

    try {
      console.log('Fetching schema data with query:', schemaQuery);
      
      // Execute the query directly without going through the query() method
      // to avoid query modification by ensureUidAndType
      const endpoint = this.getEndpoint(this.getDgraphPath('/query'));
      console.log('Making schema data request to:', endpoint);
      console.log('Headers:', this.getHeaders());
      
      const response = await axios.post(
        endpoint,
        { query: schemaQuery },
        {
          headers: this.getHeaders(),
          // Add SSL configuration for verify-ca mode
          httpsAgent: this.config.sslMode === 'verify-ca' ?
            new Agent({
              rejectUnauthorized: true,
              ca: undefined // Will use system CA certificates
            }) : undefined,
          // Add timeout and retry options
          timeout: 30000,
          // Handle CORS preflight
          withCredentials: false
        }
      );

      const result = response.data;
      console.log('Schema data result:', result);
      
      // Validate the response structure
      if (result && result.data && result.data.unique_types) {
        console.log('Schema data validation successful');
        return result;
      } else {
        console.warn('Unexpected response structure:', result);
        // Still return the result as it might be valid but different
        return result;
      }
      
    } catch (error) {
      console.error('Error fetching schema data:', error);
      
      // Try CORS proxy if direct request fails
      try {
        console.log('Direct request failed, trying with CORS proxy...');
        
        const corsProxies = [
          'https://api.allorigins.win/raw?url=',
          'https://corsproxy.io/?',
          'https://thingproxy.freeboard.io/fetch/'
        ];

        for (const proxy of corsProxies) {
          try {
            console.log(`Trying CORS proxy: ${proxy}`);
            const proxyEndpoint = `${proxy}${this.config.endpoint}${this.getDgraphPath('/query')}`;
            console.log('Proxy endpoint:', proxyEndpoint);

            const proxyResponse = await axios.post(
              proxyEndpoint,
              { query: schemaQuery },
              {
                headers: this.getHeaders(),
                timeout: 30000,
                withCredentials: false
              }
            );
            console.log('CORS proxy request successful!');
            return proxyResponse.data;
          } catch (proxyError) {
            const errorMessage = proxyError instanceof Error ? proxyError.message : 'Unknown error';
            console.log(`CORS proxy ${proxy} failed:`, errorMessage);
            continue;
          }
        }
      } catch (proxyError) {
        console.error('All CORS proxies failed:', proxyError);
      }
      
      throw error;
    }
  }

  async query(query: string, variables?: Record<string, any>) {
    try {
      const endpoint = this.getEndpoint(this.getDgraphPath('/query'));
      console.log('Making query request to:', endpoint);
      console.log('Headers:', this.getHeaders());
      console.log('Query:', query);
      console.log('Variables:', variables);

      // Special handling for schema queries
      if (query.trim() === 'schema {}' || query.trim().startsWith('schema(')) {
                try {
          // First try direct request
          const response = await axios.post(
            this.getEndpoint(this.getDgraphPath('/query')),
            { query, variables },
            {
              headers: this.getHeaders(),
              // Add SSL configuration for verify-ca mode
              httpsAgent: this.config.sslMode === 'verify-ca' ?
                new Agent({
                  rejectUnauthorized: true,
                  ca: undefined // Will use system CA certificates
                }) : undefined,
              // Add timeout and retry options
              timeout: 30000,
              // Handle CORS preflight
              withCredentials: false
            }
          );
          return response.data;
        } catch (directError) {
          console.log('Direct request failed, trying with CORS proxy...');

          // Try multiple CORS proxy services
          const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://thingproxy.freeboard.io/fetch/'
          ];

          for (const proxy of corsProxies) {
            try {
              console.log(`Trying CORS proxy: ${proxy}`);
              const proxyEndpoint = `${proxy}${this.config.endpoint}${this.getDgraphPath('/query')}`;
              console.log('Proxy endpoint:', proxyEndpoint);

               const proxyResponse = await axios.post(
                 proxyEndpoint,
                 { query, variables },
                 {
                   headers: this.getHeaders(),
                   timeout: 30000,
                   withCredentials: false
                 }
               );
               console.log('CORS proxy request successful!');
               return proxyResponse.data;
                            } catch (proxyError) {
                 const errorMessage = proxyError instanceof Error ? proxyError.message : 'Unknown error';
                 console.log(`CORS proxy ${proxy} failed:`, errorMessage);
                 continue;
               }
           }

           // If all proxies fail, throw the original error
           throw directError;
         }
      }

      // Modify the query to ensure uid and dgraph.type are included
      const enhancedQuery = this.ensureUidAndType(query);

      // Log the differences if query was modified
      if (enhancedQuery !== query) {
        console.log('Query was enhanced to include uid and dgraph.type predicates');
        console.log('Original query:', query);
        console.log('Enhanced query:', enhancedQuery);
      }

      // Debug: Log the exact request being sent
      console.log('DgraphService - Final request payload:', {
        query: enhancedQuery,
        variables
      });

             try {
         // First try direct request
         const response = await axios.post(
           this.getEndpoint(this.getDgraphPath('/query')),
           {
             query: enhancedQuery,
             variables,
           },
           {
             headers: this.getHeaders(),
             timeout: 30000,
             withCredentials: false
           }
         );
         return response.data;
       } catch (directError) {
         console.log('Direct request failed, trying with CORS proxy...');

         // Try multiple CORS proxy services
         const corsProxies = [
           'https://api.allorigins.win/raw?url=',
           'https://corsproxy.io/?',
           'https://thingproxy.freeboard.io/fetch/'
         ];

         for (const proxy of corsProxies) {
           try {
             console.log(`Trying CORS proxy: ${proxy}`);
             const proxyEndpoint = `${proxy}${this.config.endpoint}${this.getDgraphPath('/query')}`;
             console.log('Proxy endpoint:', proxyEndpoint);

             const proxyResponse = await axios.post(
               proxyEndpoint,
               {
                 query: enhancedQuery,
                 variables,
               },
               {
                 headers: this.getHeaders(),
                 timeout: 30000,
                 withCredentials: false
               }
             );
             console.log('CORS proxy request successful!');
             return proxyResponse.data;
           } catch (proxyError) {
             const errorMessage = proxyError instanceof Error ? proxyError.message : 'Unknown error';
             console.log(`CORS proxy ${proxy} failed:`, errorMessage);
             continue;
           }
         }

         // If all proxies fail, throw the original error
         throw directError;
       }
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async alter(schema: string) {
    try {
      const response = await axios.post(
        this.getEndpoint(this.getDgraphPath('/alter')),
        { schema },
        {
          headers: this.getHeaders(),
          timeout: 30000,
          withCredentials: false
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
        this.getEndpoint(this.getDgraphPath('/mutate')),
        {
          mutation,
          variables,
          commitNow: false
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
          withCredentials: false
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error executing mutation:', error);
      throw error;
    }
  }

  /**
   * Check if the Dgraph endpoint is healthy and responding
   * @returns Promise<boolean> - true if healthy, false if unhealthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(
        this.getEndpoint('/health'),
        {
          headers: this.getHeaders(),
          timeout: 10000, // Shorter timeout for health checks
          withCredentials: false
        }
      );
      return response.status === 200;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }
}

export default DgraphService;
