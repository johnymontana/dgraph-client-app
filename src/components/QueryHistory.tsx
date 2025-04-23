'use client';

import React from 'react';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  description?: string;
  type?: 'query' | 'mutation';
}

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (item: QueryHistoryItem) => void;
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
    <div className="bg-gray-50 border border-gray-300 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Operation History</h3>
        <button
          onClick={onClearHistory}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Clear History
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500">No operation history yet. Run queries or mutations to see them here.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded p-2 bg-white hover:bg-gray-50 flex justify-between"
            >
              <div className="flex-1 mr-2">
                <div className="flex items-center">
                  {item.type === 'mutation' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                      Mutation
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      Query
                    </span>
                  )}
                  <div
                    className="text-sm cursor-pointer hover:text-indigo-600"
                    onClick={() => onSelectQuery(item)}
                    title="Click to use this operation"
                  >
                    {truncateQuery(item.query)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(item.timestamp)}</div>
              </div>
              <button
                onClick={() => onDeleteQuery(item.id)}
                className="text-gray-400 hover:text-red-600"
                title="Delete this operation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
