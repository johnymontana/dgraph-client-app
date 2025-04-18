import { CompletionContext, CompletionResult, autocompletion } from '@codemirror/autocomplete';
import { LanguageSupport, LRLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { sql } from '@codemirror/lang-sql';
import { ParsedSchema, determineContext, generateSuggestions } from './schemaParser';

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
    
    // Determine the context of the cursor position
    const cursorContext = determineContext(
      context.state.doc.toString(),
      context.pos
    );
    
    // Generate suggestions based on schema and context
    const suggestions = generateSuggestions(schema, word.text, cursorContext);
    
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
export function dql(schema: ParsedSchema = { predicates: [], types: [] }) {
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
