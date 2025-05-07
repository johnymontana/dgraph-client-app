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
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema>({ predicates: [], types: [] });

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

  // Auto-connect on start if connection details exist
  React.useEffect(() => {
    if (endpoint && !connected && !dgraphService) {
      // Auto-connect with a slight delay to ensure UI is loaded
      const timer = setTimeout(() => {
        connect();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [endpoint, connected, dgraphService]);

  const connect = async () => {
    try {
      setError(null);
      const config = {
        endpoint,
        apiKey: apiKey || undefined,
      };

      const service = new DgraphService(config);

      // Test connection by fetching schema
      const schemaResult = await service.getSchema();

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
    setDgraphService(null);
    setConnected(false);
    setSchemaText('');
    setParsedSchema({ predicates: [], types: [] });
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
