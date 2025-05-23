# Dgraph Client Application

A web-based client for interacting with Dgraph databases using DQL (Dgraph Query Language). This application provides a modern, intuitive interface for database administrators and developers to work with Dgraph databases without needing to use command-line tools or write code.

![Dgraph Client](img/dgraph-client.png)

## Features

- **Connection Management**
  - Connect to any Dgraph instance with endpoint URL configuration
  - Optional API key support for secured Dgraph instances
  - Visual connection status indicators
  - Secure credential handling

- **Schema Management**
  - View the current DQL schema with syntax highlighting
  - Edit and update the schema with real-time feedback
  - Support for all Dgraph schema types and directives

- **DQL Query Interface**
  - Execute DQL queries against your Dgraph instance
  - Syntax highlighting for better query writing experience
  - Error handling with descriptive error messages

- **Results Visualization**
  - Interactive graph visualization of query results
  - Node and edge visualization with proper relationship mapping
  - Drag-and-drop node positioning for better exploration
  - Zoom and pan controls for navigating complex graphs
  - Hover tooltips showing detailed node information
  - Toggle between graph and JSON views

- **Query History**
  - Persistent storage of executed queries using browser localStorage
  - Easy access to previously run queries across sessions
  - One-click query reuse from history
  - Delete individual history items or clear entire history
  - Automatic timestamps for all saved queries

- **Schema-Aware Autocomplete**
  - Intelligent suggestions based on your current Dgraph schema
  - Context-sensitive completions for DQL queries and schema editing
  - Predicate suggestions derived from your connected database
  - Function and directive autocompletion
  - Keyword suggestions for common DQL operations

## Project Architecture

The application is built with a modern React architecture using Next.js as the framework. Here's an overview of the project structure:

```
/src
  /app                  # Next.js app directory
    /page.tsx           # Main application page
    /globals.css        # Global styles including vis-network styles
  /components           # React components
    /ConnectionForm.tsx # Component for connecting to Dgraph
    /QueryEditor.tsx    # DQL query editor component
    /QueryHistory.tsx   # Query history component
    /SchemaEditor.tsx   # Schema editor component
    /GraphVisualization.tsx # Graph visualization component
  /context
    /DgraphContext.tsx  # Context provider for Dgraph connection state
  /services
    /dgraphService.ts   # Service for communicating with Dgraph
  /styles               # Additional styles
  /types                # TypeScript type definitions
```

### Key Design Patterns

1. **Context API for State Management**
   - Uses React Context API to manage global state
   - Provides Dgraph connection state throughout the application

2. **Service Layer Pattern**
   - Isolates API communication in a dedicated service layer
   - Abstracts Dgraph-specific operations

3. **Component Composition**
   - Modular components with single responsibilities
   - Reusable UI elements

4. **Responsive Design**
   - Mobile-first approach with Tailwind CSS
   - Adapts to different screen sizes

## Dependencies

The application uses the following key dependencies:

### Core Framework
- **Next.js** - React framework with server-side rendering capabilities
- **React** - UI library for building component-based interfaces
- **TypeScript** - Static type checking for JavaScript

### UI and Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - SVG icon set

### Dgraph Communication
- **dgraph-js-http** - Official Dgraph client for JavaScript
- **axios** - Promise-based HTTP client

### Code Editing
- **CodeMirror** - Text editor implemented in JavaScript
- **@uiw/react-codemirror** - React wrapper for CodeMirror
- **@codemirror/lang-sql** - SQL language support for DQL syntax highlighting
- **@codemirror/lang-json** - JSON language support

### Data Visualization
- **react-graph-vis** - React component for graph visualization
- **react-json-view-lite** - JSON viewer component

## Query History

![query-history](img/query-history.png)

The Dgraph Client Application includes a robust query history feature that automatically saves your successfully executed queries for future reference. This feature enhances productivity by allowing you to quickly reuse previous queries without having to rewrite them.

### How It Works

1. **Automatic Saving**: When you execute a successful query, it's automatically saved to your browser's localStorage.
2. **Persistent Storage**: Your query history persists across browser sessions, so you can access your queries even after closing and reopening the application.
3. **Easy Access**: Click the "History" button in the query editor to view your saved queries.
4. **Quick Reuse**: Click on any query in the history list to load it into the editor.
5. **History Management**: Delete individual queries or clear your entire history as needed.

### Implementation Details

- **LocalStorage**: Query history is stored in the browser's localStorage under the key `dgraph-client-query-history`.
- **Data Structure**: Each history item includes:
  - Unique ID (timestamp-based)
  - Query text
  - Timestamp of execution
- **Size Limitation**: History is limited to the 50 most recent queries to prevent excessive storage usage.
- **Duplicate Prevention**: Default or empty queries are not added to the history.

### Code Structure

- `QueryHistory.tsx`: A dedicated component for displaying and managing query history.
- `QueryEditor.tsx`: Integrates with localStorage to save and load query history.
- History management functions:
  - `addToHistory()`: Adds a new query to history
  - `handleClearHistory()`: Clears all history
  - `handleDeleteQuery()`: Removes a specific query
  - `handleSelectQuery()`: Loads a query from history

### Benefits

- **Time Saving**: Quickly reuse complex queries without rewriting them
- **Consistency**: Maintain a library of proven queries for reference
- **Learning**: Review previous queries to improve your DQL skills
- **Workflow Continuity**: Seamlessly continue your work across sessions

## Schema-Aware Autocomplete

![autocomplete](img/autocomplete.png)

The Dgraph Client Application features an intelligent autocomplete system that makes writing DQL queries and editing schemas faster and more accurate. This feature is context-aware and provides suggestions based on your current Dgraph schema and cursor position.

### Query Editor Autocomplete

#### How to Use

1. **Predicate Suggestions**: As you type in the query editor, you'll see suggestions for predicates from your current schema.
   ```
   {
     q(func: has(na▌) # Typing 'na' will suggest 'name' from your schema
   }
   ```

2. **Function Suggestions**: After typing a colon (`:`), you'll see suggestions for DQL functions.
   ```
   {
     q(func: eq(name, "John"))
     friends(func:▌) # Will suggest functions like uid, has, eq, etc.
   }
   ```

3. **Directive Suggestions**: After typing an at symbol (`@`), you'll see suggestions for DQL directives.
   ```
   {
     q(func: has(name)) @▌ # Will suggest directives like filter, cascade, etc.
   }
   ```

#### Benefits

- **Fewer Typos**: Autocomplete reduces errors in predicate names and syntax
- **Discover Schema**: Easily see available predicates without switching contexts
- **Learn DQL**: Discover available functions and directives as you type
- **Faster Development**: Spend less time looking up predicate names

### Schema Editor Autocomplete

#### How to Use

1. **Type Suggestions**: After a colon (`:`) or opening bracket (`[`), you'll see suggestions for data types.
   ```
   name: st▌ # Will suggest 'string'
   friends: [u▌ # Will suggest 'uid'
   ```

2. **Directive Suggestions**: After typing an at symbol (`@`), you'll see suggestions for schema directives.
   ```
   name: string @i▌ # Will suggest 'index'
   ```

3. **Index Type Suggestions**: Inside `@index()`, you'll see suggestions for index types.
   ```
   name: string @index(e▌) # Will suggest 'exact', etc.
   ```

#### Benefits

- **Consistent Schema**: Autocomplete ensures consistent type and directive usage
- **Discover Options**: Learn available index types and directives
- **Faster Schema Development**: Quickly create and modify schemas with fewer errors

## Example DQL Schemas

Here are some example DQL schemas you can use with the application:

### Simple Person Schema

```
name: string @index(exact, term) .
age: int @index(int) .
friend: [uid] @reverse .
email: string @index(exact) @upsert .
address: string .
```

### Movie Database Schema

```
director.film: [uid] @reverse .
actor.film: [uid] @reverse .
genre: [string] @index(exact) .
release_date: datetime @index(year) .
title: string @index(exact, term) .
rating: float @index(float) .
revenue: float .
running_time: int .
country: string @index(exact) .
language: string @index(exact) .
```

### E-commerce Schema

```
product.name: string @index(term) .
product.description: string @index(fulltext) .
product.price: float @index(float) .
product.category: string @index(exact) .
product.in_stock: bool @index(bool) .
product.manufacturer: uid @reverse .
user.name: string @index(exact) .
user.email: string @index(exact) @upsert .
user.orders: [uid] @reverse .
order.items: [uid] .
order.total: float .
order.date: datetime @index(day) .
```

## Example DQL Queries

Here are some example DQL queries you can run on the schemas above:

### Basic Person Query

```
{
  people(func: has(name)) {
    uid
    name
    age
    email
    address
    friend {
      uid
      name
    }
  }
}
```

### Movie Query with Filtering

```
{
  movies(func: eq(genre, "Sci-Fi")) {
    uid
    title
    rating
    release_date
    genre
    director.film {
      name
    }
    actor.film (first: 3) {
      name
    }
  }
}
```

### E-commerce Query with Pagination and Sorting

```
{
  products(func: gt(product.price, 100), orderasc: product.price, first: 10) {
    uid
    product.name
    product.price
    product.category
    product.in_stock
    product.manufacturer {
      name
    }
  }
}
```

### Advanced Query with Variables and Filtering

```
query products($category: string, $minPrice: float) {
  products(func: allofterms(product.category, $category)) @filter(ge(product.price, $minPrice)) {
    uid
    product.name
    product.price
    product.description
    product.in_stock
  }
}
```

Variables:
```json
{
  "$category": "Electronics",
  "$minPrice": 500.0
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Connecting to Dgraph

1. Start your Dgraph instance (locally or in the cloud)
2. In the application, enter your Dgraph endpoint (e.g., `http://localhost:8080`)
3. If your Dgraph instance requires authentication, enter your API key
4. Click "Connect"

### Working with Schemas

1. After connecting, the current schema will be loaded automatically
2. Edit the schema in the editor
3. Click "Update Schema" to apply changes

### Running Queries

1. Enter your DQL query in the query editor
2. Click "Run Query" to execute
3. View the results in either Graph or JSON view

## Learn More

To learn more about Dgraph and DQL, check out these resources:

- [Dgraph Documentation](https://dgraph.io/docs/) - Learn about Dgraph features and capabilities
- [DQL Query Language](https://dgraph.io/docs/query-language/) - Detailed guide to DQL syntax
- [Dgraph Schema](https://dgraph.io/docs/schema/) - Learn about schema design in Dgraph

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
