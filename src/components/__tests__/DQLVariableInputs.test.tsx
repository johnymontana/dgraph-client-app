import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import DQLVariableInputs from '../DQLVariableInputs'

describe('DQLVariableInputs', () => {
  const defaultProps = {
    variables: {},
    onVariablesChange: jest.fn(),
    query: ''
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render variables section', () => {
      render(<DQLVariableInputs {...defaultProps} />)
      
      expect(screen.getByText('Variables')).toBeInTheDocument()
    })

    it('should show no variables message when empty', () => {
      render(<DQLVariableInputs {...defaultProps} />)
      
      expect(screen.getByText(/No variables found in query/i)).toBeInTheDocument()
    })

    it('should show variables when they exist in query', () => {
      const queryWithVars = 'query getPerson($name: string, $age: int) { person(func: eq(name, $name)) @filter(ge(age, $age)) { name age } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVars} />)
      
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('age')).toBeInTheDocument()
    })
  })

  describe('variable detection', () => {
    it('should detect string variables', () => {
      const queryWithStringVar = 'query($name: string) { person(func: eq(name, $name)) { name } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithStringVar} />)
      
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('string')).toBeInTheDocument()
    })

    it('should detect int variables', () => {
      const queryWithIntVar = 'query($age: int) { person(func: ge(age, $age)) { age } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithIntVar} />)
      
      expect(screen.getByText('age')).toBeInTheDocument()
      expect(screen.getByText('int')).toBeInTheDocument()
    })

    it('should detect float variables', () => {
      const queryWithFloatVar = 'query($score: float) { person(func: ge(score, $score)) { score } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithFloatVar} />)
      
      expect(screen.getByText('score')).toBeInTheDocument()
      expect(screen.getByText('float')).toBeInTheDocument()
    })

    it('should detect boolean variables', () => {
      const queryWithBoolVar = 'query($active: bool) { person(func: eq(active, $active)) { active } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithBoolVar} />)
      
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('bool')).toBeInTheDocument()
    })

    it('should detect multiple variables of different types', () => {
      const complexQuery = `
        query getPerson($name: string, $age: int, $score: float, $active: bool) {
          person(func: eq(name, $name)) @filter(ge(age, $age) and ge(score, $score) and eq(active, $active)) {
            name age score active
          }
        }
      `
      
      render(<DQLVariableInputs {...defaultProps} query={complexQuery} />)
      
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('age')).toBeInTheDocument()
      expect(screen.getByText('score')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  describe('variable input handling', () => {
    it('should call onVariablesChange when input changes', () => {
      const queryWithVar = 'query($name: string) { person(func: eq(name, $name)) { name } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} />)
      
      const input = screen.getByDisplayValue('')
      fireEvent.change(input, { target: { value: 'John' } })
      
      expect(defaultProps.onVariablesChange).toHaveBeenCalledWith({ name: 'John' })
    })

    it('should handle existing variable values', () => {
      const queryWithVar = 'query($name: string) { person(func: eq(name, $name)) { name } }'
      const existingVars = { name: 'Jane' }
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} variables={existingVars} />)
      
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
    })

    it('should update variable value when changed', () => {
      const queryWithVar = 'query($name: string) { person(func: eq(name, $name)) { name } }'
      const existingVars = { name: 'Jane' }
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} variables={existingVars} />)
      
      const input = screen.getByDisplayValue('Jane')
      fireEvent.change(input, { target: { value: 'John' } })
      
      expect(defaultProps.onVariablesChange).toHaveBeenCalledWith({ name: 'John' })
    })
  })

  describe('input validation', () => {
    it('should validate string input', () => {
      const queryWithVar = 'query($name: string) { person(func: eq(name, $name)) { name } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should validate int input', () => {
      const queryWithVar = 'query($age: int) { person(func: ge(age, $age)) { age } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should validate float input', () => {
      const queryWithVar = 'query($score: float) { person(func: ge(score, $score)) { score } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('step', 'any')
    })

    it('should validate boolean input', () => {
      const queryWithVar = 'query($active: bool) { person(func: eq(active, $active)) { active } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryWithVar} />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'checkbox')
    })
  })

  describe('complex queries', () => {
    it('should handle nested queries with variables', () => {
      const nestedQuery = `
        query getPerson($name: string, $minAge: int) {
          person(func: eq(name, $name)) @filter(ge(age, $minAge)) {
            name
            age
            friends @filter(ge(age, $minAge)) {
              name
              age
            }
          }
        }
      `
      
      render(<DQLVariableInputs {...defaultProps} query={nestedQuery} />)
      
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('minAge')).toBeInTheDocument()
    })

    it('should handle queries with array variables', () => {
      const arrayQuery = 'query($ids: [uid]) { person(func: uid($ids)) { name } }'
      
      render(<DQLVariableInputs {...defaultProps} query={arrayQuery} />)
      
      expect(screen.getByText('ids')).toBeInTheDocument()
      expect(screen.getByText('[uid]')).toBeInTheDocument()
    })

    it('should handle queries with default values', () => {
      const defaultValueQuery = 'query($name: string = "default") { person(func: eq(name, $name)) { name } }'
      
      render(<DQLVariableInputs {...defaultProps} query={defaultValueQuery} />)
      
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('string = "default"')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty query', () => {
      render(<DQLVariableInputs {...defaultProps} query="" />)
      
      expect(screen.getByText(/No variables found in query/i)).toBeInTheDocument()
    })

    it('should handle query with no variables', () => {
      const queryNoVars = 'query { person { name age } }'
      
      render(<DQLVariableInputs {...defaultProps} query={queryNoVars} />)
      
      expect(screen.getByText(/No variables found in query/i)).toBeInTheDocument()
    })

    it('should handle malformed query gracefully', () => {
      const malformedQuery = 'query($name: { person { name } }'
      
      expect(() => {
        render(<DQLVariableInputs {...defaultProps} query={malformedQuery} />)
      }).not.toThrow()
    })

    it('should handle special characters in variable names', () => {
      const specialCharQuery = 'query($user_name: string, $user_age: int) { person(func: eq(name, $user_name)) @filter(ge(age, $user_age)) { name age } }'
      
      render(<DQLVariableInputs {...defaultProps} query={specialCharQuery} />)
      
      expect(screen.getByText('user_name')).toBeInTheDocument()
      expect(screen.getByText('user_age')).toBeInTheDocument()
    })
  })

  describe('performance', () => {
    it('should handle large queries efficiently', () => {
      const largeQuery = `
        query getLargeDataset(
          $name: string, $age: int, $score: float, $active: bool,
          $city: string, $country: string, $zip: string, $phone: string,
          $email: string, $website: string, $description: string
        ) {
          person(func: eq(name, $name)) @filter(
            ge(age, $age) and ge(score, $score) and eq(active, $active) and
            eq(city, $city) and eq(country, $country) and eq(zip, $zip)
          ) {
            name age score active city country zip phone email website description
          }
        }
      `
      
      const startTime = performance.now()
      render(<DQLVariableInputs {...defaultProps} query={largeQuery} />)
      const endTime = performance.now()
      
      // Should render in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      
      // Should show all variables
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('age')).toBeInTheDocument()
      expect(screen.getByText('score')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('city')).toBeInTheDocument()
      expect(screen.getByText('country')).toBeInTheDocument()
      expect(screen.getByText('zip')).toBeInTheDocument()
      expect(screen.getByText('phone')).toBeInTheDocument()
      expect(screen.getByText('email')).toBeInTheDocument()
      expect(screen.getByText('website')).toBeInTheDocument()
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })
})
