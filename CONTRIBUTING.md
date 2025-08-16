# Contributing to DGraph Client Application

Thank you for your interest in contributing to the DGraph Client Application! This document provides comprehensive guidance for developers who want to contribute to this project.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Testing Strategy](#testing-strategy)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Style and Standards](#code-style-and-standards)
- [Pull Request Process](#pull-request-process)
- [Troubleshooting](#troubleshooting)

## Project Overview

The DGraph Client Application is a modern, web-based client for interacting with DGraph databases. It provides an intuitive interface for writing and executing DQL queries, visualizing graph data, managing database schemas, and learning DGraph through interactive guides.

### Key Features

- **Database Connection Management**: Connect to DGraph instances with secure authentication
- **Query Editor**: Write and execute DQL queries with syntax highlighting and autocomplete
- **Graph Visualization**: Interactive visualization of query results using multiple rendering engines
- **Schema Management**: View and edit database schemas with visual representation
- **Interactive Learning**: Step-by-step guides for learning DGraph DQL
- **Responsive Design**: Mobile-first design that works across all device sizes

## Architecture Overview

The application follows a modern React architecture with Next.js 15, built using TypeScript and Chakra UI v3. The architecture emphasizes:

- **Component-Based Design**: Modular, reusable components with clear separation of concerns
- **Type Safety**: Full TypeScript coverage for better development experience
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Performance**: Optimized rendering with Next.js App Router and Turbopack
- **Accessibility**: WCAG compliant components and keyboard navigation

### Technology Stack

- **Frontend Framework**: Next.js 15 with App Router
- **UI Library**: Chakra UI v3 with custom theming
- **Language**: TypeScript 5
- **Package Manager**: pnpm
- **Build Tool**: Turbopack (Next.js built-in)
- **Testing**: Jest with React Testing Library
- **Code Quality**: ESLint with Next.js configuration

## Development Setup

### Prerequisites

- **Node.js**: Version 18.17 or higher
- **pnpm**: Version 8.0 or higher (recommended) or npm 9+
- **Git**: Latest version
- **Code Editor**: VS Code with TypeScript support (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dgraph-client-app.git
   cd dgraph-client-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   pnpm run dev
   # or
   npm run dev
   ```

The application will be available at `http://localhost:3000`

### Available Scripts

- `pnpm run dev` - Start development server with Turbopack
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run test` - Run Jest tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Generate test coverage report
- `pnpm run type-check` - Run TypeScript type checking
- `pnpm run clean` - Clean dependencies and build artifacts

## Project Structure

```
dgraph-client-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Home page component
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── __tests__/         # Component tests
│   │   └── *.tsx              # Feature components
│   ├── context/               # React Context providers
│   ├── services/              # Business logic and API services
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   └── styles/                # Component-specific styles
├── public/                    # Static assets
├── jest.config.js            # Jest configuration
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Core Components

### 1. Application Shell

The application shell consists of three main components that work together:

#### Toolbar (`src/components/Toolbar.tsx`)
- **Purpose**: Top navigation bar with app branding and global actions
- **Features**: 
  - Sidebar toggle button
  - App title and version
  - Theme toggle (light/dark mode)
  - Connection status indicator
  - Help and disconnect buttons
- **Responsive**: Adapts layout for mobile and desktop

#### Sidebar (`src/components/Sidebar.tsx`)
- **Purpose**: Main navigation and section switching
- **Features**:
  - Connection management
  - Schema editor
  - Interactive guides
  - Query editor
- **Responsive**: Collapsible with mobile overlay support

#### ContentPanel (`src/components/ContentPanel.tsx`)
- **Purpose**: Renders content based on active sidebar section
- **Features**:
  - Dynamic content rendering
  - Responsive layout management
  - Section-specific components

### 2. Database Connection

#### ConnectionForm (`src/components/ConnectionForm.tsx`)
- **Purpose**: Manages DGraph database connections
- **Features**:
  - Connection string input
  - Authentication configuration
  - Quick connect options
  - Connection status display

#### DgraphContext (`src/context/DgraphContext.tsx`)
- **Purpose**: Global state management for database connections
- **Features**:
  - Connection state management
  - Service instance management
  - Error handling
  - Connection lifecycle management

#### DgraphService (`src/services/dgraphService.ts`)
- **Purpose**: Business logic for DGraph API interactions
- **Features**:
  - Query execution
  - Mutation handling
  - Schema retrieval
  - Connection string parsing

### 3. Query and Visualization

#### QueryEditor (`src/components/QueryEditor.tsx`)
- **Purpose**: DQL query and mutation editor
- **Features**:
  - CodeMirror integration with DQL syntax
  - Query history management
  - Variable input support
  - Interactive guides integration
  - Fullscreen mode

#### GraphVisualization (`src/components/GraphVisualization.tsx`)
- **Purpose**: Renders graph data from query results
- **Features**:
  - Sigma.js integration
  - Interactive node manipulation
  - Physics simulation controls
  - Node type coloring
  - Zoom and pan controls

#### GeoVisualization (`src/components/GeoVisualization.tsx`)
- **Purpose**: Geographic data visualization
- **Features**:
  - Leaflet.js integration
  - Map-based data display
  - Coordinate plotting
  - Interactive markers

### 4. Schema Management

#### SchemaEditor (`src/components/SchemaEditor.tsx`)
- **Purpose**: DQL schema editing and management
- **Features**:
  - Schema text editor
  - Syntax validation
  - Schema updates
  - Version control

#### SchemaVisualization (`src/components/SchemaVisualization.tsx`)
- **Purpose**: Visual representation of database schema
- **Features**:
  - Graph-based schema display
  - Node type relationships
  - Predicate visualization
  - Interactive exploration

### 5. Learning and Guides

#### GuidedExperience (`src/components/GuidedExperience.tsx`)
- **Purpose**: Interactive DQL learning experience
- **Features**:
  - Step-by-step tutorials
  - Interactive examples
  - Progress tracking
  - Query loading

#### MdxGuideRenderer (`src/components/mdx/MdxGuideRenderer.tsx`)
- **Purpose**: Renders MDX content for guides
- **Features**:
  - Custom MDX components
  - Syntax highlighting
  - Interactive elements
  - Responsive layout

## State Management

### Context-Based State Management

The application uses React Context for global state management, avoiding the complexity of external state management libraries:

#### DgraphContext
```typescript
interface DgraphContextType {
  connected: boolean;
  endpoint: string;
  apiKey: string;
  error: string | null;
  dgraphService: DgraphService | null;
  parsedSchema: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  setEndpoint: (endpoint: string) => void;
  setApiKey: (apiKey: string) => void;
}
```

#### Color Mode Context
- Manages light/dark theme switching
- Integrates with `next-themes` for system preference detection
- Provides semantic color tokens for consistent theming

### Local Component State

Components use React hooks for local state management:
- `useState` for simple state
- `useEffect` for side effects and lifecycle management
- `useCallback` for memoized functions
- `useRef` for DOM references and imperative handles

## Data Flow

### 1. Connection Flow

```
User Input → ConnectionForm → DgraphContext → DgraphService → DGraph API
     ↓
Connection Status → UI Updates → Sidebar/StatusIndicator
```

### 2. Query Execution Flow

```
QueryEditor → handleRunOperation → DgraphService → DGraph API
     ↓
Query Results → onQueryResult → GraphVisualization/GeoVisualization
     ↓
Query History → LocalStorage → QueryHistory Component
```

### 3. Schema Management Flow

```
SchemaEditor → Schema Updates → DgraphService → DGraph API
     ↓
Schema Data → SchemaVisualization → Interactive Graph
     ↓
Schema Parsing → Type Definitions → Autocomplete
```

## Testing Strategy

### Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for tests
- **@testing-library/user-event**: User interaction simulation

### Test Structure

```
src/components/__tests__/
├── ComponentName.test.tsx     # Component tests
├── ComponentName.integration.test.tsx  # Integration tests
└── test-utils.tsx             # Shared test utilities
```

### Testing Patterns

#### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

#### Context Testing
```typescript
import { renderHook } from '@testing-library/react';
import { DgraphProvider, useDgraph } from '../DgraphContext';

const wrapper = ({ children }) => (
  <DgraphProvider>{children}</DgraphProvider>
);

const { result } = renderHook(() => useDgraph(), { wrapper });
```

## Contributing Guidelines

### Before You Start

1. **Check existing issues**: Look for existing issues or discussions
2. **Discuss changes**: Open an issue to discuss significant changes
3. **Fork the repository**: Create your own fork for development

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   pnpm run test
   pnpm run type-check
   pnpm run lint
   pnpm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Code Style and Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use generic types where appropriate
- Avoid `any` type - use proper typing or `unknown`

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Use proper prop typing with interfaces
- Implement proper error boundaries

### Styling

- Use Chakra UI components and props
- Follow the semantic token system
- Use responsive design patterns
- Implement proper accessibility attributes

### File Organization

- One component per file
- Group related components in directories
- Use index files for clean imports
- Keep components focused and single-purpose

## Pull Request Process

### PR Requirements

1. **Description**: Clear description of changes and rationale
2. **Testing**: All tests must pass
3. **Type Safety**: No TypeScript errors
4. **Linting**: No ESLint warnings or errors
5. **Build**: Application must build successfully
6. **Responsiveness**: Changes work on mobile and desktop

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and builds
2. **Code Review**: At least one maintainer must approve
3. **Testing**: Manual testing may be required
4. **Documentation**: Update relevant documentation

### After Approval

1. **Squash and Merge**: Maintainers will squash commits
2. **Version Update**: Version bump if needed
3. **Release Notes**: Update CHANGELOG.md

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and reinstall dependencies
pnpm run clean
pnpm install

# Check TypeScript errors
pnpm run type-check

# Verify Next.js configuration
pnpm run build
```

#### Test Failures
```bash
# Run tests with verbose output
pnpm run test --verbose

# Check test environment
pnpm run test:watch

# Verify Jest configuration
cat jest.config.js
```

#### Development Server Issues
```bash
# Clear Next.js cache
rm -rf .next

# Check port conflicts
lsof -i :3000

# Restart with clean state
pnpm run dev
```

### Getting Help

- **GitHub Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the README.md and code comments
- **Community**: Engage with other contributors

## Conclusion

Thank you for contributing to the DGraph Client Application! Your contributions help make this tool more powerful and user-friendly for the DGraph community.

Remember:
- Start small and iterate
- Test thoroughly
- Follow the established patterns
- Ask questions when unsure
- Have fun building great software!

Happy coding! 🚀
