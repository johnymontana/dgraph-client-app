'use client';

import React from 'react';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  description?: string;
}

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
  onDeleteQuery: (id: string) => void;
}

export default function QueryHistory({
  history,
  onSelectQuery,
  onClearHistory,
  onDeleteQuery
}: QueryHistoryProps) {
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Truncate query for display
  const truncateQuery = (query: string, maxLength = 50) => {
    return query.length > maxLength
      ? query.substring(0, maxLength).replace(/\n/g, ' ') + '...'
      : query.replace(/\n/g, ' ');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Query History</h3>
        <button
          onClick={onClearHistory}
          className="text-sm text-red-600 hover:text-red-800"
          disabled={history.length === 0}
        >
          Clear All
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No query history yet. Run some queries to see them here.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {history.map((item) => (
              <li key={item.id} className="py-3 hover:bg-gray-50">
                <div className="flex justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => onSelectQuery(item.query)}>
                    <p className="text-sm font-medium text-indigo-600">{formatDate(item.timestamp)}</p>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{truncateQuery(item.query)}</p>
                    {item.description && (
                      <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteQuery(item.id);
                    }}
                    className="text-gray-400 hover:text-red-600 ml-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
