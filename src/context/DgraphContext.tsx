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

export function DgraphProvider({ children }: { children: ReactNode }) {
  const [dgraphService, setDgraphService] = useState<DgraphService | null>(null);
  const [connected, setConnected] = useState(false);
  const [endpoint, setEndpoint] = useState('http://localhost:8080');
  const [apiKey, setApiKey] = useState('');
  const [hypermodeRouterKey, setHypermodeRouterKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [schemaText, setSchemaText] = useState('');
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema>({ predicates: [], types: [] });

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
