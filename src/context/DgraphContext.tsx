'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import DgraphService from '@/services/dgraphService';
import { ParsedSchema, parseSchema } from '@/utils/schemaParser';

interface DgraphContextType {
  dgraphService: DgraphService | null;
  connected: boolean;
  endpoint: string;
  apiKey: string;
  hypermodeRouterKey: string;
  setEndpoint: (endpoint: string) => void;
  setApiKey: (apiKey: string) => void;
  setHypermodeRouterKey: (key: string) => void;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
  schemaText: string;
  parsedSchema: ParsedSchema;
  updateSchemaText: (text: string) => void;
}

const DgraphContext = createContext<DgraphContextType | undefined>(undefined);

// Storage keys for localStorage
const STORAGE_KEY_ENDPOINT = 'dgraph_endpoint';
const STORAGE_KEY_API_KEY = 'dgraph_api_key';
const STORAGE_KEY_HYPERMODE_KEY = 'dgraph_hypermode_key';
const STORAGE_KEY_AUTOCONNECT = 'dgraph_autoconnect'; // New key to track if user explicitly connected

// Function to safely load from localStorage (handles SSR)
const loadFromStorage = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.warn('Error reading from localStorage', e);
    return defaultValue;
  }
};

export function DgraphProvider({ children }: { children: ReactNode }) {
  const [dgraphService, setDgraphService] = useState<DgraphService | null>(null);
  const [connected, setConnected] = useState(false);
  const [endpoint, setEndpointState] = useState<string>(() =>
    loadFromStorage(STORAGE_KEY_ENDPOINT, 'http://localhost:8080')
  );
  const [apiKey, setApiKeyState] = useState<string>(() =>
    loadFromStorage(STORAGE_KEY_API_KEY, '')
  );
  const [hypermodeRouterKey, setHypermodeRouterKeyState] = useState<string>(() =>
    loadFromStorage(STORAGE_KEY_HYPERMODE_KEY, '')
  );
  const [error, setError] = useState<string | null>(null);
  const [schemaText, setSchemaText] = useState('');
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema>({ types: [] });

  console.log('DgraphProvider state:', { connected, endpoint, apiKey, error });

  // Wrapper functions to update both state and localStorage
  const setEndpoint = (value: string) => {
    setEndpointState(value);
    try {
      localStorage.setItem(STORAGE_KEY_ENDPOINT, value);
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  };

  const setApiKey = (value: string) => {
    setApiKeyState(value);
    try {
      localStorage.setItem(STORAGE_KEY_API_KEY, value);
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  };

  const setHypermodeRouterKey = (value: string) => {
    setHypermodeRouterKeyState(value);
    try {
      localStorage.setItem(STORAGE_KEY_HYPERMODE_KEY, value);
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  };

  // Auto-connect on start only if user has explicitly connected before
  React.useEffect(() => {
    // Only auto-connect if:
    // 1. We have an endpoint
    // 2. We're not already connected
    // 3. We don't already have a service instance
    // 4. User has explicitly connected before (stored in localStorage)
    const hasExplicitlyConnected = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY_AUTOCONNECT) === 'true';

    // Check if we're trying to connect to the default endpoint without explicit user permission
    const isDefaultEndpoint = endpoint === 'http://localhost:8080';
    const shouldAutoConnect = hasExplicitlyConnected && endpoint && !connected && !dgraphService;

    console.log(`Auto-connect check: ${shouldAutoConnect ? 'Will connect' : 'Will NOT connect'} (explicitly connected: ${hasExplicitlyConnected})`);

    if (shouldAutoConnect) {
      // Auto-connect with a slight delay to ensure UI is loaded
      const timer = setTimeout(() => {
        connect();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [endpoint, connected, dgraphService]);

  const connect = async () => {
    try {
      console.log('DgraphContext.connect() called with endpoint:', endpoint);
      setError(null);

      // Parse the connection string to extract endpoint, SSL settings, and bearer token
      const parsedConnection = DgraphService.parseConnectionString(endpoint);
      console.log('Parsed connection:', parsedConnection);

      const config = {
        endpoint: parsedConnection.endpoint,
        apiKey: apiKey || undefined,
        sslMode: parsedConnection.sslMode,
        bearerToken: parsedConnection.bearerToken || apiKey || undefined,
      };
      console.log('Service config:', config);

      // Mark that the user has explicitly connected (for auto-connect on refresh)
      try {
        localStorage.setItem(STORAGE_KEY_AUTOCONNECT, 'true');
      } catch (e) {
        console.warn('Could not save auto-connect preference', e);
      }

      const service = new DgraphService(config);
      console.log('DgraphService instance created');

      // Test connection by fetching schema
      console.log('Testing connection by fetching schema...');
      const schemaResult = await service.getSchema();
      console.log('Schema result:', schemaResult);

      // Process schema for autocomplete
      if (schemaResult && schemaResult.data && schemaResult.data.schema) {
        const newSchemaText = schemaResult.data.schema.map((item: any) => {
          return `${item.predicate}: ${item.type} ${item.index ? '@index(' + item.index + ')' : ''} ${item.upsert ? '@upsert' : ''} ${item.lang ? '@lang' : ''} ${item.reverse ? '@reverse' : ''} .`;
        }).join('\n');

        setSchemaText(newSchemaText);
        setParsedSchema(parseSchema(newSchemaText));
      }

      setDgraphService(service);
      setConnected(true);
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect to Dgraph. Please check your endpoint and API key.');
      setConnected(false);
      setDgraphService(null);
    }
  };

  const disconnect = () => {
    // Immediate UI State update
    setConnected(false);

    // Force clean localstorage first to ensure clean state even if something fails later
    try {
      // Remove all credentials from localStorage
      localStorage.removeItem(STORAGE_KEY_API_KEY);
      localStorage.removeItem(STORAGE_KEY_HYPERMODE_KEY);
      localStorage.removeItem(STORAGE_KEY_AUTOCONNECT); // Clear auto-connect flag

      // Optionally clear endpoint too for complete reset
      // localStorage.removeItem(STORAGE_KEY_ENDPOINT);

      // Log for debugging
      console.log('Successfully removed credentials from localStorage');
    } catch (e) {
      console.error('Error removing credentials from localStorage:', e);
    }

    // Reset all state variables to ensure clean slate
    setDgraphService(null);
    setSchemaText('');
    setParsedSchema({ types: [] });
    setApiKeyState('');
    setHypermodeRouterKeyState('');
    setError(null); // Also clear any previous errors

    // Force triggering any effects that depend on these values
    setTimeout(() => {
      // Double-check disconnection state
      if (localStorage.getItem(STORAGE_KEY_API_KEY)) {
        console.warn('API key still exists in localStorage - forcing removal');
        try {
          localStorage.removeItem(STORAGE_KEY_API_KEY);
          localStorage.removeItem(STORAGE_KEY_HYPERMODE_KEY);
        } catch (e) {
          console.error('Final attempt to clear localStorage failed:', e);
        }
      }
      console.log('Disconnect complete - state fully reset');
    }, 100);
  };

  const updateSchemaText = (text: string) => {
    setSchemaText(text);
    setParsedSchema(parseSchema(text));
  };

  return (
    <DgraphContext.Provider
      value={{
        dgraphService,
        connected,
        endpoint,
        apiKey,
        hypermodeRouterKey,
        setEndpoint,
        setApiKey,
        setHypermodeRouterKey,
        connect,
        disconnect,
        error,
        schemaText,
        parsedSchema,
        updateSchemaText,
      }}
    >
      {children}
    </DgraphContext.Provider>
  );
}

export function useDgraph() {
  const context = useContext(DgraphContext);
  if (context === undefined) {
    throw new Error('useDgraph must be used within a DgraphProvider');
  }
  return context;
}
