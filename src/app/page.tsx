'use client';

import { useState } from 'react';
import { DgraphProvider } from '@/context/DgraphContext';
import ConnectionForm from '@/components/ConnectionForm';
import QueryEditor from '@/components/QueryEditor';
import SchemaEditor from '@/components/SchemaEditor';
import GraphVisualization from '@/components/GraphVisualization';
import Drawer from '@/components/Drawer';
import ResizableContainer from '@/components/ResizableContainer';

export default function Home() {
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <DgraphProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              {/* Drawer toggle button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="mr-4 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Open settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Dgraph Client</h1>
            </div>
            <div className="text-sm text-gray-500">DQL Explorer</div>
          </div>
        </header>

        {/* Drawer for Connection and Schema */}
        <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Dgraph Settings</h2>
          <ConnectionForm />
          <SchemaEditor />
        </Drawer>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            {/* Query and Visualization with resizable container */}
            <div className="h-[calc(100vh-200px)]">
              <ResizableContainer
                direction="vertical"
                initialSplit={40}
                minFirstSize={20}
                minSecondSize={20}
                firstComponent={<QueryEditor onQueryResult={setQueryResult} />}
                secondComponent={<GraphVisualization data={queryResult} />}
              />
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
