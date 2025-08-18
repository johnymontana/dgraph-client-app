'use client';

export interface McpConfig {
  endpoint?: string;
  apiKey?: string;
  serverUrl: string;
  bearerToken: string;
}

export class McpService {
  private config: McpConfig;
  private connected: boolean = false;
  private sessionId: string | null = null;
  private messageEndpoint: string | null = null;
  private sseController: AbortController | null = null;
  private keepAliveConnection: boolean = false;

  constructor(config: McpConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // Validate required configuration
      if (!this.config.serverUrl || !this.config.bearerToken) {
        throw new Error('MCP server URL and bearer token are required');
      }

      // Start persistent SSE connection
      await this.startSseConnection();
      
      this.connected = true;
      console.log('MCP Service connected to:', this.config.serverUrl);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw new Error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.keepAliveConnection = false;
    if (this.sseController) {
      this.sseController.abort();
      this.sseController = null;
    }
    this.sessionId = null;
    this.messageEndpoint = null;
  }

  private async startSseConnection(): Promise<void> {
    this.keepAliveConnection = true;
    this.sseController = new AbortController();

    try {
      const response = await fetch(this.config.serverUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Accept': 'text/event-stream'
        },
        signal: this.sseController.signal
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        
        // Read the first event to get session info
        const { done, value } = await reader.read();
        if (!done) {
          const text = decoder.decode(value);
          console.log('SSE session data:', text);
          const sessionMatch = text.match(/sessionId=([a-f0-9-]+)/);
          if (sessionMatch) {
            this.sessionId = sessionMatch[1];
            this.messageEndpoint = `https://patient-graph-willsworkspace.hypermode.host/mcp/message?sessionId=${this.sessionId}`;
            console.log('Session ID:', this.sessionId);
          }
        }

        // Keep connection alive in background but don't block
        this.maintainSseConnection(reader, decoder);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('SSE connection error:', error);
        throw error;
      }
    }
  }

  private async maintainSseConnection(reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder): Promise<void> {
    // Run in background to keep session alive
    (async () => {
      try {
        while (this.keepAliveConnection) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          if (text.includes('sessionId=')) {
            console.log('SSE keep-alive:', text);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError' && this.keepAliveConnection) {
          console.warn('SSE connection lost:', error);
          // Could implement reconnection logic here
        }
      } finally {
        try {
          reader.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
      }
    })();
  }

  async callTool(name: string, arguments_: Record<string, any>): Promise<any> {
    if (!this.connected || !this.messageEndpoint) {
      throw new Error('MCP client not connected or no active session');
    }

    try {
      // Use the session-based message endpoint with the persistent connection
      const response = await fetch(this.messageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.bearerToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: name,
            arguments: arguments_
          }
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCP server returned ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from MCP server');
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse MCP response:', responseText);
        throw new Error(`Invalid JSON response from MCP server: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error) {
      console.error('MCP tool call failed:', error);
      throw error;
    }
  }


  private async readSseResponse(response: Response): Promise<any> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return result;
            }
            try {
              const parsed = JSON.parse(data);
              // Look for tool response in the parsed data
              if (parsed.content || parsed.result || parsed.text) {
                result = parsed;
              }
            } catch (e) {
              // Ignore non-JSON data lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return result || { content: [{ text: 'No response received from MCP server' }] };
  }

  async getAvailableTools(): Promise<any[]> {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }

    return [
      {
        name: 'generate_dql_query',
        description: 'Generate DQL query from natural language description'
      }
    ];
  }

  isConnected(): boolean {
    return this.connected;
  }
}