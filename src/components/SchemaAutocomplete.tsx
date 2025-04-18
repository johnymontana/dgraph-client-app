'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SchemaAutocompleteProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  schema: string;
  cursorPosition: number;
  onSuggestionSelect: (suggestion: string) => void;
}

export default function SchemaAutocomplete({
  editorRef,
  schema,
  cursorPosition,
  onSuggestionSelect
}: SchemaAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Schema keywords and types for autocompletion
  const schemaKeywords = [
    'string', 'int', 'float', 'bool', 'datetime', 'geo', 'uid',
    '@index', '@reverse', '@upsert', '@lang'
  ];
  
  // Index types
  const indexTypes = ['exact', 'term', 'fulltext', 'hash'];

  useEffect(() => {
    // Get current word at cursor
    const currentWord = getCurrentWord(schema, cursorPosition);
    
    // Determine context
    const context = getContext(schema, cursorPosition);
    
    // Generate suggestions based on context
    let newSuggestions: string[] = [];
    
    if (context === 'directive') {
      // After @ symbol, suggest directives without the @ prefix
      newSuggestions = ['index', 'reverse', 'upsert', 'lang']
        .filter(dir => dir.toLowerCase().startsWith(currentWord.toLowerCase()));
    } else if (context === 'type') {
      // After colon or opening bracket, suggest types
      newSuggestions = ['string', 'int', 'float', 'bool', 'datetime', 'geo', 'uid']
        .filter(type => type.toLowerCase().startsWith(currentWord.toLowerCase()));
    } else if (context === 'index') {
      // Inside @index(), suggest index types
      newSuggestions = indexTypes
        .filter(idx => idx.toLowerCase().startsWith(currentWord.toLowerCase()));
    } else {
      // Default suggestions include all schema keywords
      newSuggestions = schemaKeywords
        .filter(kw => kw.toLowerCase().startsWith(currentWord.toLowerCase()));
    }
    
    setSuggestions(newSuggestions);
    setSelectedIndex(0);
    setVisible(newSuggestions.length > 0);
    
    // Calculate position for suggestions dropdown
    if (editorRef.current && newSuggestions.length > 0) {
      calculatePosition();
    }
  }, [schema, cursorPosition]);

  // Calculate position for the suggestions dropdown
  const calculatePosition = () => {
    if (!editorRef.current) return;
    
    // Find cursor position in editor
    const editor = editorRef.current;
    const editorRect = editor.getBoundingClientRect();
    
    // This is an approximation - in a real implementation, you'd get the actual cursor position
    // from CodeMirror's API, but for simplicity we're using an approximation
    const lineHeight = 20; // Approximate line height
    const lineCount = schema.substring(0, cursorPosition).split('\n').length - 1;
    const charPos = cursorPosition - schema.substring(0, cursorPosition).lastIndexOf('\n') - 1;
    
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
  const getContext = (text: string, position: number): 'directive' | 'type' | 'index' | 'general' => {
    const beforeCursor = text.substring(0, position);
    
    // Check if we're after an @ symbol
    if (beforeCursor.match(/@[\w]*$/)) {
      return 'directive';
    }
    
    // Check if we're after a colon or opening bracket (type context)
    if (beforeCursor.match(/[:[][\w]*$/)) {
      return 'type';
    }
    
    // Check if we're inside @index()
    if (beforeCursor.match(/@index\([^)]*$/)) {
      return 'index';
    }
    
    // Default to general context
    return 'general';
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
