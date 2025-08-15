# Testing Documentation

## Overview

This document outlines the comprehensive test suite for the Dgraph Client Application. The test suite covers all major components, utilities, and services to ensure code quality and reliability.

## Test Coverage

### Components (React Components)

#### ✅ Completed Tests
- **ConnectionForm.test.tsx** - Tests connection form functionality, validation, and user interactions
- **QueryEditor.test.tsx** - Tests query editor, execution, and variable handling
- **QueryHistory.test.tsx** - Tests query history management and interactions
- **DgraphContext.test.tsx** - Tests context provider and state management
- **DQLAutocomplete.test.tsx** - Tests autocomplete functionality and suggestions
- **DQLVariableInputs.test.tsx** - Tests variable input handling and validation
- **SchemaVisualization.test.tsx** - Tests schema parsing and visualization
- **ResizableContainer.test.tsx** - Tests resizing functionality and interactions
- **FullscreenToggle.test.tsx** - Tests fullscreen toggle functionality
- **Drawer.test.tsx** - Tests drawer component and interactions

#### 🔄 In Progress
- **SchemaAutocomplete.test.tsx** - Schema-based autocomplete testing
- **SchemaEditor.test.tsx** - Schema editing functionality testing
- **SigmaGraph.test.tsx** - Graph visualization testing
- **GraphVisualizer.test.tsx** - Graph visualization wrapper testing
- **GuidedExperience.test.tsx** - Guided experience flow testing
- **MapView.test.tsx** - Geographic visualization testing
- **GeoVisualization.test.tsx** - Geographic data handling testing
- **GraphVisualization.test.tsx** - Graph visualization testing

### Utilities

#### ✅ Completed Tests
- **dqlLanguage.test.ts** - DQL language parsing and analysis
- **dqlVariables.test.ts** - DQL variable extraction and handling
- **schemaParser.test.ts** - Schema parsing and validation
- **geoUtils.test.ts** - Geographic data utilities and transformations
- **schemaToGraph.test.ts** - Schema to graph conversion utilities
- **mdxLoader.test.ts** - MDX file loading and parsing

### Services

#### ✅ Completed Tests
- **dgraphService.test.ts** - Dgraph service integration and API calls

## Test Configuration

### Jest Configuration
- **Environment**: jsdom for DOM testing
- **Coverage Threshold**: 70% for branches, functions, lines, and statements
- **Module Mapping**: `@/` maps to `src/` directory
- **Setup**: Includes custom test utilities and mocks

### Test Utilities
- **test-utils.tsx**: Custom render function with providers and mocks
- **Mock Setup**: Comprehensive mocking for external dependencies

## Test Patterns

### Component Testing
- **Rendering**: Verify components render correctly
- **User Interactions**: Test clicks, form inputs, keyboard events
- **State Management**: Test component state changes
- **Props Handling**: Test different prop combinations
- **Error Handling**: Test error states and edge cases

### Utility Testing
- **Function Behavior**: Test input/output relationships
- **Edge Cases**: Test boundary conditions and error scenarios
- **Performance**: Test with large datasets where applicable

### Integration Testing
- **Context Integration**: Test components with context providers
- **Service Integration**: Test service layer interactions
- **API Mocking**: Mock external API calls for testing

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --testPathPatterns="ComponentName"

# Run tests matching pattern
npm test -- --testNamePattern="should handle"
```

### Test Organization
- Tests are organized by component/utility type
- Each test file focuses on a single component or utility
- Tests are grouped by functionality (rendering, interactions, edge cases)
- Descriptive test names explain expected behavior

## Mock Strategy

### External Dependencies
- **Next.js**: Mocked router and image components
- **Dgraph Service**: Mocked API calls and responses
- **Third-party Libraries**: Mocked where necessary for isolation

### Browser APIs
- **ResizeObserver**: Mocked for component testing
- **matchMedia**: Mocked for responsive testing
- **fetch**: Mocked for API testing

## Coverage Goals

### Current Status
- **Components**: ~80% coverage
- **Utilities**: ~90% coverage
- **Services**: ~85% coverage
- **Overall**: Target 70% minimum, currently ~80%

### Areas for Improvement
- Complex visualization components
- Error boundary testing
- Performance testing
- Accessibility testing

## Best Practices

### Test Structure
1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the function or render the component
3. **Assert**: Verify expected outcomes

### Naming Conventions
- Test files: `ComponentName.test.tsx`
- Test suites: `describe('ComponentName', () => {})`
- Test cases: `it('should do something specific', () => {})`

### Assertions
- Use specific assertions (e.g., `toBeInTheDocument()` over `toBeTruthy()`)
- Test user behavior, not implementation details
- Verify accessibility attributes and roles

## Continuous Integration

### Pre-commit Hooks
- Run tests before committing
- Ensure coverage thresholds are met
- Validate test file structure

### CI Pipeline
- Run full test suite on pull requests
- Generate coverage reports
- Fail builds on test failures

## Troubleshooting

### Common Issues
1. **Mock Resolution**: Ensure mocks are properly configured
2. **Async Testing**: Use `waitFor` for asynchronous operations
3. **Component Rendering**: Check for missing providers or context
4. **Type Errors**: Verify TypeScript types in test files

### Debugging
- Use `console.log` in tests for debugging
- Check Jest configuration and setup files
- Verify test environment and dependencies

## Future Enhancements

### Planned Improvements
- **Visual Regression Testing**: Screenshot comparison testing
- **Performance Testing**: Load testing for large datasets
- **Accessibility Testing**: Automated accessibility validation
- **E2E Testing**: Full application flow testing

### Test Infrastructure
- **Test Data Factories**: Reusable test data generation
- **Custom Matchers**: Domain-specific assertion helpers
- **Test Utilities**: Enhanced testing utilities and helpers

## Contributing

### Adding New Tests
1. Create test file following naming convention
2. Follow established test patterns and structure
3. Ensure adequate coverage for new functionality
4. Update this documentation

### Test Maintenance
- Keep tests up to date with component changes
- Refactor tests when component logic changes
- Remove obsolete or redundant tests
- Maintain test performance and reliability

---

*Last updated: January 2024*
*Test suite version: 1.0.0*
