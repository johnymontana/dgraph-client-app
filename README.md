# Dgraph Client Application

A modern, responsive web-based client for interacting with Dgraph databases using DQL (Dgraph Query Language). This application provides an intuitive, mobile-first interface for database administrators and developers to work with Dgraph databases without needing to use command-line tools or write code.

![Dgraph Client](img/dgraph-client.png)

## ✨ Features

- **🎯 Modern UI/UX**
  - **Chakra UI v3**: Beautiful, accessible components with semantic design tokens
  - **Responsive Design**: Mobile-first design that works perfectly on all devices
  - **Dark/Light Themes**: Automatic theme switching with system preference detection
  - **Accessibility**: WCAG compliant components with keyboard navigation

- **🔌 Connection Management**
  - Connect to any Dgraph instance with endpoint URL configuration
  - Optional API key support for secured Dgraph instances
  - Visual connection status indicators with real-time updates
  - Secure credential handling and connection state management

- **📊 Schema Management**
  - View the current DQL schema with syntax highlighting
  - Edit and update the schema with real-time feedback
  - Support for all Dgraph schema types and directives
  - Interactive schema visualization with graph representation

- **💻 DQL Query Interface**
  - Execute DQL queries against your Dgraph instance
  - **CodeMirror Integration**: Advanced syntax highlighting and autocomplete
  - **Query Variables**: Support for parameterized queries
  - **Error Handling**: Descriptive error messages with context
  - **Fullscreen Mode**: Distraction-free query editing

- **🎨 Results Visualization**
  - **Multiple Visualization Engines**: Sigma.js, react-graph-vis, and Leaflet.js
  - **Interactive Graph Visualization**: Node and edge manipulation with physics simulation
  - **Geographic Data Support**: Map-based visualization for location data
  - **Responsive Views**: Toggle between graph, JSON, and map views
  - **Advanced Controls**: Zoom, pan, node positioning, and simulation settings

- **📚 Query History & Learning**
  - Persistent storage of executed queries using browser localStorage
  - **Interactive Guides**: Step-by-step DQL tutorials with examples
  - **Query Templates**: Pre-built queries for common operations
  - **Learning Path**: Progressive difficulty levels for DQL mastery

- **🧠 Intelligent Autocomplete**
  - **Schema-Aware Suggestions**: Based on your current Dgraph schema
  - **Context-Sensitive Completions**: DQL queries and schema editing
  - **Real-Time Updates**: Suggestions update as you modify schemas
  - **Function & Directive Support**: Complete DQL language coverage

## 🏗️ Project Architecture

The application follows a modern, scalable React architecture using Next.js 15 with the App Router, built with TypeScript and Chakra UI v3. The architecture emphasizes:

- **Component-Based Design**: Modular, reusable components with clear separation of concerns
- **Type Safety**: Full TypeScript coverage for better development experience
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Performance**: Optimized rendering with Next.js App Router and Turbopack
- **Accessibility**: WCAG compliant components and keyboard navigation

### 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Shell                        │
├─────────────────────────────────────────────────────────────┤
│  Toolbar │ Sidebar │ ContentPanel                         │
│  (Header)│ (Nav)   │ (Dynamic Content)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Feature Components                        │
├─────────────────────────────────────────────────────────────┤
│ Connection │ Schema │ Guides │ Query                      │
│ Management │ Editor │ System │ Editor                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│ DgraphContext │ DgraphService │ Local Storage             │
│ (State Mgmt)  │ (API Client)  │ (Query History)          │
└─────────────────────────────────────────────────────────────┘
```

### 🗂️ Project Structure

```
dgraph-client-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes for guides and data
│   │   ├── globals.css        # Global styles and Chakra UI overrides
│   │   ├── layout.tsx         # Root layout with Chakra UI providers
│   │   └── page.tsx           # Main application page
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components and theme
│   │   │   ├── provider.tsx   # Chakra UI provider setup
│   │   │   ├── theme.ts       # Custom theme with semantic tokens
│   │   │   └── color-mode.tsx # Theme switching logic
│   │   ├── __tests__/         # Component tests
│   │   ├── mdx/               # MDX rendering components
│   │   └── *.tsx              # Feature components
│   ├── context/               # React Context providers
│   │   └── DgraphContext.tsx  # Global Dgraph state management
│   ├── services/              # Business logic and API services
│   │   └── dgraphService.ts   # Dgraph API communication
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions and helpers
│   └── styles/                # Component-specific styles
├── public/                    # Static assets and images
├── jest.config.js            # Jest testing configuration
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

### 🔑 Key Design Patterns

1. **Context-Based State Management**
   - Uses React Context API for global state (no external libraries)
   - Provides Dgraph connection state throughout the application
   - Manages theme switching and user preferences

2. **Service Layer Pattern**
   - Isolates API communication in a dedicated service layer
   - Abstracts Dgraph-specific operations and error handling
   - Provides clean interfaces for data operations

3. **Component Composition**
   - Modular components with single responsibilities
   - Reusable UI elements with consistent styling
   - Responsive design patterns throughout

4. **Semantic Design System**
   - Custom Chakra UI theme with semantic color tokens
   - Consistent spacing, typography, and component variants
   - Dark/light mode support with system preference detection

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15** - React framework with App Router and Turbopack
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Static type checking and modern JavaScript features

### UI and Styling
- **Chakra UI v3** - Modern component library with semantic design tokens
- **Emotion** - CSS-in-JS styling solution
- **Responsive Design** - Mobile-first approach with breakpoint system

### Package Management
- **pnpm** - Fast, disk space efficient package manager
- **Turbopack** - Next.js built-in bundler for fast development

### Dgraph Communication
- **dgraph-js-http** - Official Dgraph client for JavaScript
- **axios** - Promise-based HTTP client with interceptors

### Code Editing
- **CodeMirror 6** - Modern text editor with DQL syntax support
- **@uiw/react-codemirror** - React wrapper for CodeMirror
- **Language Support** - DQL, JSON, and SQL syntax highlighting

### Data Visualization
- **Sigma.js** - Modern graph visualization library
- **react-sigma** - React wrapper for Sigma.js
- **Leaflet.js** - Interactive maps for geographic data
- **react-leaflet** - React wrapper for Leaflet.js

### Testing and Quality
- **Jest** - Test runner with React Testing Library
- **ESLint** - Code quality and consistency
- **TypeScript** - Compile-time error checking

## 📱 Responsive Design

The application is built with a **mobile-first approach** and provides an excellent experience across all device sizes:

### Breakpoint System
- **Mobile**: 0px - 768px (full-width sidebar overlay)
- **Tablet**: 768px - 992px (medium sidebar width)
- **Desktop**: 992px+ (standard sidebar width)

### Responsive Features
- **Adaptive Layout**: Content adjusts based on screen size
- **Touch-Friendly**: Optimized for mobile and tablet interaction
- **Collapsible Sidebar**: Auto-hides on mobile for better space usage
- **Flexible Content**: Main content expands to use available space
- **Mobile Overlay**: Dark backdrop when sidebar is open on mobile

## 🎨 Theme System

### Semantic Design Tokens
The application uses a custom Chakra UI theme with semantic color tokens:

```typescript
// Background colors
'bg.primary': { _light: 'gray.50', _dark: 'gray.950' }
'bg.secondary': { _light: 'white', _dark: 'gray.900' }
'bg.sidebar': { _light: 'white', _dark: 'gray.900' }

// Foreground colors
'fg.primary': { _light: 'gray.900', _dark: 'white' }
'fg.secondary': { _light: 'gray.700', _dark: 'gray.300' }

// Accent colors
'accent.primary': { _light: 'blue.600', _dark: 'blue.400' }
'accent.success': { _light: 'green.600', _dark: 'green.400' }
```

### Theme Switching
- **Automatic Detection**: Follows system preference by default
- **Manual Override**: Users can manually switch between light/dark
- **Persistent**: Theme choice is saved across sessions
- **Smooth Transitions**: Animated theme switching with CSS transitions

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18.17 or higher
- **pnpm**: Version 8.0 or higher (recommended) or npm 9+
- **Git**: Latest version

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dgraph-client-app.git
   cd dgraph-client-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to see the application

### Available Scripts

```bash
# Development
pnpm run dev          # Start development server with Turbopack
pnpm run build        # Build for production
pnpm run start        # Start production server

# Testing & Quality
pnpm run test         # Run Jest tests
pnpm run test:watch   # Run tests in watch mode
pnpm run test:coverage # Generate test coverage report
pnpm run lint         # Run ESLint
pnpm run type-check   # Run TypeScript type checking

# Maintenance
pnpm run clean        # Clean dependencies and build artifacts
pnpm run reinstall    # Clean and reinstall dependencies
```

## 🔌 Connecting to Dgraph

### Basic Connection
1. Start your Dgraph instance (locally or in the cloud)
2. In the application, enter your Dgraph endpoint (e.g., `http://localhost:8080`)
3. If your Dgraph instance requires authentication, enter your API key
4. Click "Connect" to establish the connection

### Connection Types Supported
- **HTTP/HTTPS**: Standard web protocols
- **DGraph Protocol**: Native DGraph protocol with SSL support
- **Hypermode**: Cloud-hosted DGraph instances
- **Local Development**: Localhost connections for development

### Security Features
- **SSL/TLS Support**: Secure connections with certificate verification
- **API Key Management**: Secure storage of authentication credentials
- **Connection Validation**: Automatic endpoint validation and testing

## 📊 Working with Data

### Query Editor
- **Syntax Highlighting**: DQL syntax with CodeMirror integration
- **Autocomplete**: Schema-aware suggestions for predicates and functions
- **Query Variables**: Support for parameterized queries
- **Fullscreen Mode**: Distraction-free editing experience

### Visualization Options
- **Graph View**: Interactive node-edge visualization with Sigma.js
- **JSON View**: Structured data display with syntax highlighting
- **Map View**: Geographic data visualization with Leaflet.js
- **Table View**: Tabular data representation

### Advanced Features
- **Physics Simulation**: Configurable force-directed layouts
- **Node Clustering**: Automatic grouping of similar nodes
- **Search & Filter**: Find specific nodes or relationships
- **Export Options**: Save visualizations as images or data

## 🧪 Testing

### Test Coverage
The application includes comprehensive testing with:
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **Visual Regression**: UI consistency testing
- **Accessibility Tests**: WCAG compliance verification

### Running Tests
```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage

# Run specific test file
pnpm run test QueryEditor.test.tsx
```

## 📚 Interactive Learning Guides

The application features a comprehensive interactive guides system that provides hands-on learning experiences for DQL and graph database concepts.

### Available Guides

1. **Introduction to Dgraph Query Language** (`01-introduction.mdx`)
   - Basic DQL syntax and structure
   - Setting up schemas and sample data
   - Your first interactive queries

2. **Filtering Data in DQL** (`02-filtering.mdx`)
   - Predicate-based filtering
   - Regular expression patterns
   - Genre and type-based queries

3. **Graph Traversal in DQL** (`03-graph-traversal.mdx`)
   - Relationship traversal patterns
   - Multi-level graph exploration
   - Reverse edge navigation

4. **Mutations and Data Management** (`04-mutations-and-data-management.mdx`)
   - Schema definition and updates
   - Data insertion and updates
   - Relationship management

5. **E-commerce Dataset Guide** (`05-e-commerce-dataset.mdx`)
   - Complete e-commerce data model
   - Product catalogs and customer analytics
   - Order management queries

6. **Social Network Analysis** (`06-social-network-analysis.mdx`)
   - Social graph modeling
   - Influence and engagement analytics
   - Network growth analysis

7. **Geospatial Data and Location Queries** (`07-geospatial-data.mdx`)
   - Geographic data types
   - Location-based queries
   - Spatial analysis patterns

8. **Advanced Analytics and Aggregations** (`08-advanced-analytics.mdx`)
   - Complex aggregation functions
   - Time-based analytics
   - Business intelligence patterns

### Creating New Guides

To create a new interactive guide:

1. **Create the MDX file** in `src/mdx/guides/` with the naming pattern `XX-guide-name.mdx`:
   ```bash
   touch src/mdx/guides/09-my-new-guide.mdx
   ```

2. **Add frontmatter metadata** at the top of your file:
   ```yaml
   ---
   title: "Your Guide Title"
   description: "Brief description of what this guide covers"
   order: 9
   ---
   ```

3. **Write your guide content** using standard Markdown syntax with special interactive code blocks:

   ```markdown
   # Your Guide Title
   
   Introduction to your topic...
   
   ## Interactive Query Example
   
   ```dql-query
   {
     your_query(func: has(predicate)) {
       uid
       predicate
     }
   }
   ```
   
   ## Schema Updates
   
   ```dql-schema
   type YourType {
     field: string @index(term) .
   }
   ```
   
   ## Data Mutations
   
   ```dql-mutation
   {
     set {
       _:node <predicate> "value" .
       _:node <dgraph.type> "YourType" .
     }
   }
   ```
   ```

4. **Interactive Code Block Types**:
   - **`dql-query`**: Runnable DQL queries with "Run Query" button
   - **`dql-mutation`**: Executable mutations with "Run Mutation" button  
   - **`dql-schema`**: Schema definitions with "View Schema" and "Apply Schema" buttons
   - **Regular code blocks**: Standard syntax highlighting

5. **Guide Structure Best Practices**:
   - Start with schema definition when introducing new concepts
   - Provide sample data through mutations
   - Follow with progressive query examples
   - Include real-world use cases and scenarios
   - Use consistent naming conventions
   - Always include `uid` in queries for proper visualization

6. **Testing Your Guide**:
   - Restart the development server: `npm run dev`
   - Navigate to the Guides tab
   - Your new guide will appear in the selection interface
   - Test all interactive code blocks work correctly

### Guide Content Guidelines

- **Educational Flow**: Structure content from basic to advanced
- **Interactive Examples**: Include clickable code blocks for key concepts
- **Real Datasets**: Use relatable examples (movies, e-commerce, social networks)
- **Visualization Ready**: Ensure queries return data suitable for graph visualization
- **Error Handling**: Provide alternative queries if data might not exist
- **Cross-References**: Link concepts between different guides

### External Resources
- [Dgraph Documentation](https://dgraph.io/docs/) - Official Dgraph guides
- [DQL Reference](https://dgraph.io/docs/query-language/) - Complete DQL syntax
- [Schema Design](https://dgraph.io/docs/schema/) - Schema best practices
- [Performance Tuning](https://dgraph.io/docs/deploy/) - Optimization guides

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines on:

- Setting up your development environment
- Understanding the project architecture
- Making code contributions
- Testing and quality standards
- Pull request process

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Dgraph Team** - For the excellent database and client libraries
- **Chakra UI Team** - For the beautiful component library
- **Next.js Team** - For the amazing React framework
- **Open Source Community** - For all the amazing tools and libraries

---

**Happy querying! 🚀**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-username/dgraph-client-app).
