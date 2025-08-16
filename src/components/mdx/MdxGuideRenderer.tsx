'use client';

import React from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';

interface CodeBlockProps {
  children: string;
  className?: string;
}

interface MdxGuideRendererProps {
  content: MDXRemoteSerializeResult;
  onLoadQuery: (query: string) => void;
}

export default function MdxGuideRenderer({ content, onLoadQuery }: MdxGuideRendererProps) {
  // Custom components for MDX rendering
  const components = {
    // Override pre and code blocks to handle special dql-query language
    pre: (props: any) => <div {...props} className="relative my-4" />,
    code: (props: CodeBlockProps) => {
      const className = props.className || '';
      const language = className.replace('language-', '');
      
      // Special handling for dql-query code blocks
      if (language === 'dql-query') {
        return (
          <div className="relative bg-indigo-50 border border-indigo-200 rounded-md p-4 my-4">
            <pre className="text-sm font-mono text-gray-800 overflow-x-auto">
              {props.children}
            </pre>
            <button
              onClick={() => onLoadQuery(props.children)}
              className="absolute right-2 top-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded hover:bg-indigo-600 transition-colors"
            >
              Load Query
            </button>
          </div>
        );
      }
      
      // Regular code blocks
      return (
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto my-4">
          <code className={`text-sm font-mono ${className}`}>{props.children}</code>
        </pre>
      );
    },
    h1: (props: any) => <h1 {...props} className="text-2xl font-bold mb-4 mt-6" />,
    h2: (props: any) => <h2 {...props} className="text-xl font-bold mb-3 mt-5" />,
    h3: (props: any) => <h3 {...props} className="text-lg font-bold mb-2 mt-4" />,
    // Use div instead of p to avoid nesting issues with pre/code blocks
    p: (props: any) => <div {...props} className="mb-4" />,
    ul: (props: any) => <ul {...props} className="list-disc pl-6 mb-4" />,
    ol: (props: any) => <ol {...props} className="list-decimal pl-6 mb-4" />,
    li: (props: any) => <li {...props} className="mb-1" />,
    a: (props: any) => <a {...props} className="text-indigo-600 hover:underline" />,
    blockquote: (props: any) => (
      <blockquote
        {...props}
        className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4"
      />
    ),
  };

  return <MDXRemote {...content} components={components} />;
}
