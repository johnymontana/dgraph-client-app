'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import DgraphService from '@/services/dgraphService';

interface DgraphContextType {
  dgraphService: DgraphService | null;
  connected: boolean;
  endpoint: string;
  apiKey: string;
  setEndpoint: (endpoint: string) => void;
  setApiKey: (apiKey: string) => void;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
}

const DgraphContext = createContext<DgraphContextType | undefined>(undefined);

export function DgraphProvider({ children }: { children: ReactNode }) {
  const [dgraphService, setDgraphService] = useState<DgraphService | null>(null);
  const [connected, setConnected] = useState(false);
  const [endpoint, setEndpoint] = useState('http://localhost:8080');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      setError(null);
      const config = {
        endpoint,
        apiKey: apiKey || undefined,
      };
      
      const service = new DgraphService(config);
      
      // Test connection by fetching schema
      await service.getSchema();
      
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
  };

  return (
    <DgraphContext.Provider
      value={{
        dgraphService,
        connected,
        endpoint,
        apiKey,
        setEndpoint,
        setApiKey,
        connect,
        disconnect,
        error,
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
