import { CompletionContext, CompletionResult, autocompletion } from '@codemirror/autocomplete';
import { LanguageSupport, LRLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { sql } from '@codemirror/lang-sql';
import { ParsedSchema } from './schemaParser';

// Extend SQL parser with DQL-specific syntax highlighting
const dqlHighlighting = syntaxHighlighting(HighlightStyle.define([
  { tag: t.keyword, color: '#5a67d8' },
  { tag: t.operator, color: '#6b7280' },
  { tag: t.special(t.variableName), color: '#047857' },
  { tag: t.propertyName, color: '#047857' },
  { tag: t.typeName, color: '#c026d3' },
  { tag: t.number, color: '#0369a1' },
  { tag: t.string, color: '#b91c1c' },
  { tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.function(t.variableName), color: '#0284c7' },
  { tag: t.modifier, color: '#c026d3' }
]));

// DQL keywords for syntax highlighting
const dqlKeywords = [
  'func', 'has', 'uid', 'eq', 'lt', 'le', 'gt', 'ge', 'allof', 'anyof',
  'allofterms', 'anyofterms', 'regexp', 'near', 'within', 'contains',
  'intersects', 'uid_in', 'type', 'first', 'offset', 'after', 'orderasc',
  'orderdesc', 'count', 'sum', 'avg', 'min', 'max', 'filter', 'facets',
  'cascade', 'normalize', 'groupby', 'ignorereflex', 'recurse', 'lambda',
  'query', 'mutation', 'schema', 'fragment'
];

// Create a function to generate completions based on schema
function createDqlCompletions(schema: ParsedSchema) {
  return (context: CompletionContext): CompletionResult | null => {
    // Don't autocomplete in comments or strings
    if (context.tokenBefore(['LineComment', 'BlockComment', 'String'])) {
      return null;
    }
    
    // Get the word at cursor
    const word = context.matchBefore(/\w*/);
    if (!word) return null;
    
        // Simple context detection
    const beforeCursor = context.state.doc.toString().substring(0, context.pos);
    let cursorContext: 'function' | 'predicate' | 'directive' | 'type' = 'predicate';

    if (beforeCursor.match(/@[\w]*$/)) {
      cursorContext = 'directive';
    } else if (beforeCursor.match(/:\s*[\w]*$/)) {
      cursorContext = 'function';
    } else if (beforeCursor.match(/type\s+[\w]*$/)) {
      cursorContext = 'type';
    }

    // Generate suggestions based on schema and context
    let suggestions: string[] = [];

    if (cursorContext === 'function') {
      suggestions = getDQLFunctions();
    } else if (cursorContext === 'directive') {
      suggestions = ['index', 'upsert', 'lang', 'reverse', 'count', 'list'];
    } else if (cursorContext === 'type') {
      suggestions = ['string', 'int', 'float', 'bool', 'datetime', 'geo', 'password'];
    } else {
      // For predicates, include schema fields and DQL keywords
      const schemaFields = schema.types?.flatMap(type =>
        type.fields?.map(field => field.name) || []
      ) || [];
      suggestions = [...getDQLKeywords(), ...schemaFields];
    }

    // Filter suggestions based on input
    suggestions = suggestions.filter(s =>
      s.toLowerCase().includes(word.text.toLowerCase())
    );
    
    if (suggestions.length === 0) return null;
    
    return {
      from: word.from,
      options: suggestions.map(suggestion => ({
        label: suggestion,
        type: cursorContext === 'function' ? 'function' : 
              cursorContext === 'predicate' ? 'property' :
              cursorContext === 'directive' ? 'keyword' :
              cursorContext === 'type' ? 'type' : 'text'
      }))
    };
  };
}

// Create DQL language support with schema-aware autocomplete
export function dql(schema: ParsedSchema = { types: [] }) {
  // Instead of returning a LanguageSupport object, return an array of extensions
  // that can be directly passed to CodeMirror
  return [
    // Use SQL extension as base
    sql(),
    // Add autocompletion
    autocompletion({ override: [createDqlCompletions(schema)] }),
    // Add syntax highlighting
    dqlHighlighting
  ];
}

export interface DQLSuggestion {
  label: string;
  type: 'keyword' | 'function' | 'predicate';
  description?: string;
}

export interface DQLValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Get DQL keywords for autocomplete
 */
export function getDQLKeywords(): string[] {
  return [
    'query',
    'mutation',
    'schema',
    'type',
    'interface',
    'input',
    'enum',
    'scalar',
    'union',
    'fragment',
    'directive',
    'on',
    'true',
    'false',
    'null'
  ];
}

/**
 * Get DQL functions for autocomplete
 */
export function getDQLFunctions(): string[] {
  return [
    'count',
    'sum',
    'avg',
    'min',
    'max',
    'len',
    'eq',
    'ne',
    'gt',
    'ge',
    'lt',
    'le',
    'regexp',
    'match',
    'alloftext',
    'anyoftext',
    'uid',
    'uid_in',
    'has',
    'type'
  ];
}

/**
 * Get DQL predicates for autocomplete
 */
export function getDQLPredicates(): string[] {
  return [
    'uid',
    'dgraph.type',
    'dgraph.id',
    'dgraph.tag',
    'dgraph.edge',
    'dgraph.node',
    'dgraph.pred',
    'dgraph.val',
    'dgraph.uid',
    'dgraph.xid'
  ];
}

/**
 * Get DQL suggestions based on input
 */
export function getDQLSuggestions(input: string): DQLSuggestion[] {
  const suggestions: DQLSuggestion[] = [];
  
  // Add keywords
  getDQLKeywords().forEach(keyword => {
    if (keyword.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({
        label: keyword,
        type: 'keyword',
        description: `DQL keyword: ${keyword}`
      });
    }
  });

  // Add functions
  getDQLFunctions().forEach(func => {
    if (func.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({
        label: func,
        type: 'function',
        description: `DQL function: ${func}()`
      });
    }
  });

  // Add predicates
  getDQLPredicates().forEach(predicate => {
    if (predicate.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({
        label: predicate,
        type: 'predicate',
        description: `DQL predicate: ${predicate}`
      });
    }
  });

  return suggestions;
}

/**
 * Check if a string is a valid DQL query
 */
export function isDQLQuery(input: string): boolean {
  if (!input || input.trim().length === 0) {
    return false;
  }
  
  const trimmedInput = input.trim();
  
  // Simple query with braces
  if (/^\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Query with variables
  if (/^query\s*\(.*\)\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Query without variables
  if (/^query\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Mutation
  if (/^mutation\s*\(.*\)\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Mutation without variables
  if (/^mutation\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Schema query
  if (/^schema\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Type definitions
  if (/^(type|interface|enum|input)\s+\w+\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Scalar definition
  if (/^scalar\s+\w+$/.test(trimmedInput)) {
    return true;
  }
  
  // Union definition
  if (/^union\s+\w+\s*=\s*\w+(\s*\|\s*\w+)*$/.test(trimmedInput)) {
    return true;
  }
  
  // Fragment definition
  if (/^fragment\s+\w+\s+on\s+\w+\s*\{.*\}$/.test(trimmedInput)) {
    return true;
  }
  
  // Directive definition
  if (/^directive\s+@\w+/.test(trimmedInput)) {
    return true;
  }
  
  return false;
}

/**
 * Validate DQL syntax
 */
export function validateDQLSyntax(input: string): DQLValidationResult {
  const errors: string[] = [];
  
  if (!input || input.trim().length === 0) {
    errors.push('Query cannot be empty');
    return { isValid: false, errors };
  }
  
  // Check for balanced braces
  const braceStack: string[] = [];
  const bracePairs: { [key: string]: string } = {
    '{': '}',
    '(': ')',
    '[': ']'
  };
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (bracePairs[char]) {
      braceStack.push(char);
    } else if (Object.values(bracePairs).includes(char)) {
      const expectedOpen = Object.keys(bracePairs).find(key => bracePairs[key] === char);
      if (braceStack.length === 0 || braceStack.pop() !== expectedOpen) {
        errors.push(`Mismatched brace: unexpected '${char}'`);
      }
    }
  }
  
  // Check for unclosed braces
  if (braceStack.length > 0) {
    braceStack.forEach(openBrace => {
      const closeBrace = bracePairs[openBrace];
      errors.push(`Missing closing brace '${closeBrace}' for '${openBrace}'`);
    });
  }
  
  // Check for basic DQL structure - but be more lenient
  if (!input.includes('{') && !input.includes('}')) {
    // Only require braces for most queries, but allow some special cases
    if (!input.includes('schema') && !input.includes('type') && !input.includes('scalar')) {
      errors.push('Query must contain at least one block');
    }
  }
  
  // Don't require specific field patterns for simple queries
  // Just check that the basic structure is valid
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
