'use client';

import { useState } from 'react';
import { DgraphProvider } from '@/context/DgraphContext';
import ConnectionForm from '@/components/ConnectionForm';
import QueryEditor from '@/components/QueryEditor';
import SchemaEditor from '@/components/SchemaEditor';
import GraphVisualization from '@/components/GraphVisualization';

export default function Home() {
  const [queryResult, setQueryResult] = useState<any>(null);

  return (
    <DgraphProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dgraph Client</h1>
            <div className="text-sm text-gray-500">DQL Explorer</div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Connection and Schema */}
              <div className="lg:col-span-1">
                <ConnectionForm />
                <SchemaEditor />
              </div>
              
              {/* Right column - Query and Visualization */}
              <div className="lg:col-span-2">
                <QueryEditor onQueryResult={setQueryResult} />
                <GraphVisualization data={queryResult} />
              </div>
            </div>
          </div>
        </main>
        
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              Dgraph Client - DQL Explorer
            </p>
          </div>
        </footer>
      </div>
    </DgraphProvider>
  );
}
