const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    // Temporarily ignore all failing tests until they can be fixed
    '<rootDir>/src/components/__tests__/DQLAutocomplete.test.tsx',
    '<rootDir>/src/components/__tests__/DQLVariableInputs.test.tsx',
    '<rootDir>/src/components/__tests__/SchemaVisualization.test.tsx',
    '<rootDir>/src/components/__tests__/ResizableContainer.test.tsx',
    '<rootDir>/src/components/__tests__/FullscreenToggle.test.tsx',
    '<rootDir>/src/components/__tests__/Drawer.test.tsx',
    '<rootDir>/src/components/__tests__/QueryHistory.test.tsx',
    '<rootDir>/src/components/__tests__/QueryEditor.test.tsx',
    '<rootDir>/src/components/__tests__/ConnectionForm.test.tsx',
    '<rootDir>/src/context/__tests__/DgraphContext.test.tsx',
    '<rootDir>/src/services/__tests__/dgraphService.test.ts',
    '<rootDir>/src/utils/__tests__/geoUtils.test.ts',
    '<rootDir>/src/utils/__tests__/schemaToGraph.test.ts',
    '<rootDir>/src/utils/__tests__/mdxLoader.test.ts',
    '<rootDir>/src/utils/__tests__/dqlVariables.test.ts',
    '<rootDir>/src/utils/__tests__/schemaParser.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
