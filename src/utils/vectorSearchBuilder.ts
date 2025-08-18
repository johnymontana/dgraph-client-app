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
    queryVector: embedding,
    topK,
    alpha
  };

  let query: string;

  if (baseQuery) {
    query = baseQuery.replace(/\$queryVector\b/g, '$queryVector')
                    .replace(/\$topK\b/g, '$topK')
                    .replace(/\$alpha\b/g, '$alpha');
  } else {
    query = `query vectorSearch($queryVector: [float], $topK: int, $alpha: float) {
  vectorSearch(by: ${field}, vector: $queryVector, topk: $topK, alpha: $alpha) {
    uid
    dgraph.type
    ${field}
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