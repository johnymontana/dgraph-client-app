# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js web application that provides a modern interface for interacting with Dgraph databases using DQL (Dgraph Query Language). It serves as a client application for database administrators and developers to query, visualize, and manage Dgraph databases without command-line tools.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Package Manager
The project uses npm with lock files present for both npm (`package-lock.json`) and pnpm (`pnpm-lock.yaml`). Use npm for consistency with the documented scripts.

## Architecture Overview

### State Management Pattern
The application uses React Context API for global state management through `DgraphContext`:
- **DgraphProvider** (`src/context/DgraphContext.tsx`): Manages connection state, schema, and Dgraph service instance
- **useDgraph hook**: Provides access to Dgraph state throughout the application
- **localStorage integration**: Persists connection settings and auto-connects on app load

### Service Layer Architecture  
- **DgraphService** (`src/services/dgraphService.ts`): Centralized service for all Dgraph operations
  - Handles HTTP requests to Dgraph endpoints
  - Automatically enhances queries to include `uid` and `dgraph.type` predicates
  - Manages API key authentication
  - Provides methods: `query()`, `mutate()`, `alter()`, `getSchema()`

### Component Structure
- **Connection Management**: `ConnectionForm.tsx` - Handles Dgraph endpoint connection
- **Query Interface**: `QueryEditor.tsx` - DQL query editor with autocomplete and history
- **Schema Management**: `SchemaEditor.tsx` - Schema viewing and editing
- **Visualization**: Multiple components for different visualization types:
  - `GraphVisualization.tsx` - Interactive graph rendering
  - `GeoVisualization.tsx` - Geographic data visualization
  - `SigmaGraph.tsx` - Advanced graph layouts using Sigma.js
- **Layout**: `ResizableContainer.tsx` - Provides split-pane interface

### Key Features Implementation
1. **Schema-Aware Autocomplete**: Uses parsed schema to provide intelligent DQL completions
2. **Query History**: Persistent localStorage-based query history (50 query limit)
3. **Multiple Visualization Modes**: Graph, JSON, and geographic visualizations
4. **Auto-Enhancement**: Queries are automatically enhanced to include essential predicates

### Data Flow
1. User connects via `ConnectionForm` → Updates `DgraphContext`
2. `DgraphService` instance created with endpoint/API key
3. Schema fetched and parsed for autocomplete functionality
4. Queries executed through service layer with auto-enhancement
5. Results visualized through appropriate visualization components

### Technology Stack Specifics
- **Next.js 15.3.1** with App Router architecture
- **React 19** with client-side rendering for interactive features
- **TypeScript 5** with strict configuration
- **Tailwind CSS 4** for styling with custom PostCSS config
- **Dgraph integration** via `dgraph-js-http` official client
- **Graph visualization** using `react-sigma`, `graphology`, and `react-graph-vis`
- **Code editing** via CodeMirror 6 with SQL/JSON language support

### File Structure Patterns
```
/src
  /app          # Next.js App Router pages and API routes
  /components   # Reusable React components 
  /context      # React Context providers
  /services     # Business logic and external API communication
  /utils        # Helper functions and utilities
  /types        # TypeScript type definitions
  /styles       # Component-specific CSS files
```

## Important Development Notes

### Query Enhancement
The `DgraphService` automatically enhances queries to include `uid` and `dgraph.type` predicates for proper graph visualization. This behavior is intentional and ensures consistent visualization results.

### State Persistence
Connection settings are automatically saved to localStorage and restored on app reload. The `DgraphContext` handles this persistence pattern consistently throughout the app.

### Autocomplete System  
The schema-aware autocomplete system depends on:
- Real-time schema parsing via `schemaParser.ts`
- Predicate extraction for DQL completions
- Function and directive suggestions based on cursor context

### Visualization Strategy
The app supports multiple visualization modes and automatically detects geographic data to show appropriate visualizations. Each visualization component is designed to work independently with the same query result data structure.