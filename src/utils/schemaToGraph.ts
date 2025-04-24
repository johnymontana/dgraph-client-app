import Graphology from 'graphology';

/**
 * Parse DQL schema text and convert it to a graphology graph
 * @param schemaText The DQL schema text
 * @returns A graphology graph representing the schema
 */
export function schemaToGraph(schemaText: string): Graphology {
  const graph = new Graphology();
  
  // Skip empty schema
  if (!schemaText || schemaText.trim() === '' || schemaText.trim() === '# No schema found or empty schema') {
    console.log('Empty schema detected, returning empty graph');
    return graph;
  }
  
  console.log('Parsing schema:', schemaText);
  
  // Map to track scalar types
  const scalarTypes = new Set([
    'int', 'float', 'string', 'bool', 'datetime', 'geo', 'password', 'uid'
  ]);
  
  // Maps for tracking node and edge creation to avoid duplicates
  const nodes = new Set<string>();
  const edges = new Set<string>();
  
  // Process schema lines
  const schemaLines = schemaText.split('\n');
  
  // Process predicate definitions (name: string @index...)
  for (const line of schemaLines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    console.log('Processing line:', trimmedLine);
    
    // Match predicate definition patterns
    // Example: name: string @index(exact) .
    const predicateMatch = trimmedLine.match(/^\s*([a-zA-Z0-9_<>.-]+)\s*:\s*([a-zA-Z0-9_<>\[\]\s]+)(?:\s+@.*)?\s*\.?\s*$/);
    
    if (predicateMatch) {
      const [_, predicateName, typeStr] = predicateMatch;
      const cleanType = typeStr.trim().replace(/\[|\]/g, '');
      
      // Skip if predicate or type is missing
      if (!predicateName || !cleanType) continue;
      
      // Add predicate node
      if (!nodes.has(predicateName)) {
        graph.addNode(predicateName, {
          label: predicateName,
          type: 'predicate',
          color: '#4285F4', // Blue for predicates
          size: 10,
          raw: { predicate: predicateName, type: cleanType }
        });
        nodes.add(predicateName);
      }
      
      // Add type node
      if (!nodes.has(cleanType)) {
        // Determine if this is a scalar, uid reference, or object type
        const isScalar = scalarTypes.has(cleanType);
        const isUid = cleanType === 'uid' || cleanType.includes('<uid>');
        
        graph.addNode(cleanType, {
          label: cleanType,
          type: isScalar ? 'scalar' : isUid ? 'uid' : 'type',
          color: isScalar ? '#34A853' : isUid ? '#FBBC05' : '#EA4335', // Green, Yellow, Red
          size: 8,
          raw: { type: cleanType }
        });
        nodes.add(cleanType);
      }
      
      // Add edge from predicate to type
      const edgeId = `${predicateName}-${cleanType}`;
      if (!edges.has(edgeId)) {
        graph.addEdge(predicateName, cleanType, {
          label: 'has type',
          size: 1,
          raw: { relationship: 'has type' }
        });
        edges.add(edgeId);
      }
    }
  }
  // Process type definitions (type Person { ... })
  const typeDefRegex = /type\s+([a-zA-Z0-9_]+)\s*\{([^}]*)\}/g;
  let typeDefMatch;
  
  while ((typeDefMatch = typeDefRegex.exec(schemaText)) !== null) {
    const typeName = typeDefMatch[1];
    const typeBody = typeDefMatch[2];
    
    console.log(`Found type definition: ${typeName}, body: ${typeBody}`);
    
    // Add type node if not exists
    if (!nodes.has(typeName)) {
      graph.addNode(typeName, {
        label: typeName,
        type: 'type',
        color: '#EA4335', // Red for types
        size: 12,
        raw: { type: typeName }
      });
      nodes.add(typeName);
    }
    
    // Extract fields from the type definition
    const fieldRegex = /([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>\[\]]+)/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(typeBody)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2].trim().replace(/\[|\]/g, '');
      
      console.log(`Found field in type ${typeName}: ${fieldName}: ${fieldType}`);
      
      // Create a compound name for the field (to avoid conflicts)
      const fieldNodeId = `${typeName}.${fieldName}`;
      
      // Add the field as a node
      if (!nodes.has(fieldNodeId)) {
        graph.addNode(fieldNodeId, {
          label: fieldName,
          type: 'field',
          color: '#4285F4', // Blue for fields
          size: 8,
          raw: { field: fieldName, type: fieldType }
        });
        nodes.add(fieldNodeId);
      }
      
      // Add an edge from the type to the field
      const typeToFieldEdge = `${typeName}-${fieldNodeId}`;
      if (!edges.has(typeToFieldEdge)) {
        graph.addEdge(typeName, fieldNodeId, {
          label: 'has field',
          size: 1,
          raw: { relationship: 'has field' }
        });
        edges.add(typeToFieldEdge);
      }
      
      // Add type node if not exists
      if (!nodes.has(fieldType)) {
        // Determine node type (scalar, uid, or type)
        const isScalar = scalarTypes.has(fieldType);
        const isUid = fieldType === 'uid' || fieldType.includes('<uid>');
        
        graph.addNode(fieldType, {
          label: fieldType,
          type: isScalar ? 'scalar' : isUid ? 'uid' : 'type',
          color: isScalar ? '#34A853' : isUid ? '#FBBC05' : '#EA4335',
          size: 8,
          raw: { type: fieldType }
        });
        nodes.add(fieldType);
      }
      
      // Add an edge from the field to its type
      const fieldToTypeEdge = `${fieldNodeId}-${fieldType}`;
      if (!edges.has(fieldToTypeEdge)) {
        graph.addEdge(fieldNodeId, fieldType, {
          label: 'has type',
          size: 1,
          raw: { relationship: 'has type' }
        });
        edges.add(fieldToTypeEdge);
      }
    }
  }
  
  // Return the completed graph
  console.log(`Created graph with ${graph.order} nodes and ${graph.size} edges`);
  return graph;
}

// Function to generate type info for the graph
/**
 * Add default nodes to a graph if it's empty
 * @param graph The graph to check and possibly populate
 * @returns The graph (with additional nodes if it was empty)
 */
export function ensureNonEmptyGraph(graph: Graphology): Graphology {
  if (graph.order === 0) {
    console.log('Adding default nodes to empty graph for demonstration');
    // Add example schema nodes for demonstration
    graph.addNode('Person', { label: 'Person', type: 'type', color: '#EA4335', size: 12 });
    graph.addNode('name', { label: 'name', type: 'predicate', color: '#4285F4', size: 10 });
    graph.addNode('string', { label: 'string', type: 'scalar', color: '#34A853', size: 8 });
    graph.addNode('age', { label: 'age', type: 'predicate', color: '#4285F4', size: 10 });
    graph.addNode('int', { label: 'int', type: 'scalar', color: '#34A853', size: 8 });
    graph.addNode('friend', { label: 'friend', type: 'predicate', color: '#4285F4', size: 10 });
    graph.addNode('uid', { label: 'uid', type: 'uid', color: '#FBBC05', size: 8 });
    
    // Add edges
    graph.addEdge('name', 'string', { label: 'has type', size: 1 });
    graph.addEdge('age', 'int', { label: 'has type', size: 1 });
    graph.addEdge('friend', 'uid', { label: 'has type', size: 1 });
    graph.addEdge('Person', 'name', { label: 'has field', size: 1 });
    graph.addEdge('Person', 'age', { label: 'has field', size: 1 });
    graph.addEdge('Person', 'friend', { label: 'has field', size: 1 });
  }
  
  console.log(`Final graph has ${graph.order} nodes and ${graph.size} edges`);
  return graph;
}

/**
 * Generate type information for the visualization legend
 * @param graph The graph to analyze
 * @returns Array of type information objects with type, color, and count
 */
export function generateTypeInfo(graph: Graphology) {
  const typeMap = new Map<string, { color: string, count: number }>();
  
  graph.forEachNode((node, attrs) => {
    const nodeType = attrs.type || 'unknown';
    
    if (!typeMap.has(nodeType)) {
      typeMap.set(nodeType, {
        color: attrs.color || '#cccccc',
        count: 1
      });
    } else {
      const current = typeMap.get(nodeType)!;
      typeMap.set(nodeType, {
        ...current,
        count: current.count + 1
      });
    }
  });
  
  return Array.from(typeMap.entries()).map(([type, info]) => ({
    type,
    color: info.color,
    count: info.count
  }));
}
