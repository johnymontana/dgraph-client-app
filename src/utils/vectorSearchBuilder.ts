export interface VectorSearchOptions {
  queryText: string;
  embedding: number[];
  field: string;
  topK?: number;
  alpha?: number;
  baseQuery?: string;
}

export function buildVectorSearchQuery(options: VectorSearchOptions): {
  query: string;
  variables: Record<string, any>;
} {
  const {
    embedding,
    field,
    topK = 10,
    alpha = 1.0,
    baseQuery
  } = options;

  const variables = {
    queryVector: JSON.stringify(embedding),
    topK: String(topK),
    alpha: String(alpha)
  };

  let query: string;

  if (baseQuery) {
    query = baseQuery.replace(/\$queryVector\b/g, '$queryVector')
                    .replace(/\$topK\b/g, '$topK')
                    .replace(/\$alpha\b/g, '$alpha');
  } else {
    // Use Dgraph's similar_to function for vector similarity search
    // This requires the field to have @index(hnsw) in the schema
    query = `{
  q(func: similar_to(${field}, $topK, $queryVector)) {
    uid
    dgraph.type
    ${field}
    name
    description
  }
}`;
  }

  return { query, variables };
}

export function hasVectorSearchSyntax(query: string): boolean {
  return /vectorSearch\s*\(/i.test(query) || /\$queryVector\b/.test(query);
}

export function extractVectorSearchField(query: string): string | null {
  const match = query.match(/vectorSearch\s*\(\s*by:\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
  return match ? match[1] : null;
}