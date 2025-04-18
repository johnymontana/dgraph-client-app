'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ParsedSchema } from '@/utils/schemaParser';

interface DQLAutocompleteProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  query: string;
  cursorPosition: number;
  schema: ParsedSchema;
  onSuggestionSelect: (suggestion: string) => void;
}

export default function DQLAutocomplete({
  editorRef,
  query,
  cursorPosition,
  schema,
  onSuggestionSelect
}: DQLAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // DQL keywords for suggestions
  const dqlKeywords = [
    'func', 'has', 'uid', 'eq', 'lt', 'le', 'gt', 'ge', 'allof', 'anyof',
    'allofterms', 'anyofterms', 'regexp', 'filter', 'first', 'offset', 'after',
    'orderasc', 'orderdesc', 'count', 'sum', 'avg', 'min', 'max', 'cascade',
    'normalize', 'groupby', 'type', 'facets'
  ];

  // DQL directives
  const dqlDirectives = [
    'filter', 'facets', 'cascade', 'normalize', 'groupby'
  ];

  useEffect(() => {
    // Get current word at cursor
    const currentWord = getCurrentWord(query, cursorPosition);
    
    // Determine context
    const context = getContext(query, cursorPosition);
    
    // Generate suggestions based on context
    let newSuggestions: string[] = [];
    
    if (context === 'directive') {
      // After @ symbol, suggest directives
      newSuggestions = dqlDirectives.filter(dir => 
        dir.toLowerCase().startsWith(currentWord.toLowerCase())
      );
    } else if (context === 'function') {
      // After colon, suggest functions
      newSuggestions = dqlKeywords.filter(kw => 
        kw.toLowerCase().startsWith(currentWord.toLowerCase())
      );
    } else {
      // In other contexts, suggest keywords and predicates from schema
      const predicateOptions = schema?.predicates?.map(p => p.predicate) || [];
      newSuggestions = [...dqlKeywords, ...predicateOptions].filter(opt => 
        opt.toLowerCase().startsWith(currentWord.toLowerCase())
      );
    }
    
    setSuggestions(newSuggestions);
    setSelectedIndex(0);
    setVisible(newSuggestions.length > 0);
    
    // Calculate position for suggestions dropdown
    if (editorRef.current && newSuggestions.length > 0) {
      calculatePosition();
    }
  }, [query, cursorPosition, schema]);

  // Calculate position for the suggestions dropdown
  const calculatePosition = () => {
    if (!editorRef.current) return;
    
    // Find cursor position in editor
    const editor = editorRef.current;
    const editorRect = editor.getBoundingClientRect();
    
    // This is an approximation - in a real implementation, you'd get the actual cursor position
    // from CodeMirror's API, but for simplicity we're using an approximation
    const lineHeight = 20; // Approximate line height
    const lineCount = query.substring(0, cursorPosition).split('\n').length - 1;
    const charPos = cursorPosition - query.substring(0, cursorPosition).lastIndexOf('\n') - 1;
    
    const top = lineCount * lineHeight + 20; // Add some offset
    const left = charPos * 8; // Approximate character width
    
    setPosition({ top, left });
  };

  // Get the current word at cursor
  const getCurrentWord = (text: string, position: number): string => {
    const beforeCursor = text.substring(0, position);
    const match = beforeCursor.match(/[\w]*$/);
    return match ? match[0] : '';
  };

  // Determine context based on cursor position
  const getContext = (text: string, position: number): 'directive' | 'function' | 'predicate' => {
    const beforeCursor = text.substring(0, position);
    
    // Check if we're after an @ symbol
    if (beforeCursor.match(/@[\w]*$/)) {
      return 'directive';
    }
    
    // Check if we're after a colon (function context)
    if (beforeCursor.match(/:[\w]*$/)) {
      return 'function';
    }
    
    // Default to predicate context
    return 'predicate';
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    setVisible(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visible) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div 
      ref={suggestionsRef}
      className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
      onKeyDown={handleKeyDown}
    >
      <ul className="py-1">
        {suggestions.map((suggestion, index) => (
          <li 
            key={suggestion}
            className={`px-3 py-1 cursor-pointer hover:bg-gray-100 ${index === selectedIndex ? 'bg-blue-100' : ''}`}
            onClick={() => handleSelect(suggestion)}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
}
