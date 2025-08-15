import React from 'react'
import { render, screen, fireEvent } from '@/utils/test-utils'
import FullscreenToggle from '../FullscreenToggle'

describe('FullscreenToggle', () => {
  const defaultProps = {
    isFullscreen: false,
    onToggle: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render fullscreen toggle button', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show enter fullscreen title when not fullscreen', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Enter fullscreen')
      expect(button).toHaveAttribute('aria-label', 'Enter fullscreen')
    })

    it('should show exit fullscreen title when fullscreen', () => {
      render(<FullscreenToggle {...defaultProps} isFullscreen={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Exit fullscreen')
      expect(button).toHaveAttribute('aria-label', 'Exit fullscreen')
    })

    it('should have proper button accessibility', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Enter fullscreen')
    })
  })

  describe('fullscreen functionality', () => {
    it('should call onToggle when button is clicked', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })

    it('should call onToggle when entering fullscreen', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })

    it('should call onToggle when exiting fullscreen', () => {
      render(<FullscreenToggle {...defaultProps} isFullscreen={true} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('keyboard accessibility', () => {
    it('should handle Enter key press', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter' })
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })

    it('should handle Space key press', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: ' ' })
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })

    it('should not trigger on other key presses', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Tab' })
      fireEvent.keyDown(button, { key: 'ArrowRight' })
      fireEvent.keyDown(button, { key: 'Escape' })
      
      expect(defaultProps.onToggle).not.toHaveBeenCalled()
    })
  })

  describe('visual states', () => {
    it('should have consistent styling regardless of fullscreen state', () => {
      const { rerender } = render(<FullscreenToggle {...defaultProps} />)
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('p-2', 'text-gray-500', 'hover:text-gray-700', 'focus:outline-none')
      
      rerender(<FullscreenToggle {...defaultProps} isFullscreen={true} />)
      
      button = screen.getByRole('button')
      expect(button).toHaveClass('p-2', 'text-gray-500', 'hover:text-gray-700', 'focus:outline-none')
    })

    it('should have hover effects', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:text-gray-700')
    })

    it('should have focus styles', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none')
    })
  })

  describe('edge cases', () => {
    it('should handle rapid clicks gracefully', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      
      // Rapid clicks
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      
      // Should call onToggle for each click
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(3)
    })

    it('should handle fullscreen state changes from external sources', () => {
      const { rerender } = render(<FullscreenToggle {...defaultProps} />)
      
      // Initially not fullscreen
      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Enter fullscreen')
      
      // Change to fullscreen
      rerender(<FullscreenToggle {...defaultProps} isFullscreen={true} />)
      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Exit fullscreen')
      
      // Change back to not fullscreen
      rerender(<FullscreenToggle {...defaultProps} isFullscreen={false} />)
      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Enter fullscreen')
    })
  })

  describe('accessibility features', () => {
    it('should have proper button role', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have descriptive aria-label', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Enter fullscreen')
    })

    it('should have descriptive title attribute', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Enter fullscreen')
    })
  })

  describe('SVG icons', () => {
    it('should render enter fullscreen icon when not fullscreen', () => {
      render(<FullscreenToggle {...defaultProps} />)
      
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
      
      // Check for the expand icon path (enter fullscreen)
      const path = svg?.querySelector('path')
      expect(path).toHaveAttribute('d', 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5')
    })

    it('should render exit fullscreen icon when fullscreen', () => {
      render(<FullscreenToggle {...defaultProps} isFullscreen={true} />)
      
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
      
      // Check for the collapse icon path (exit fullscreen)
      const path = svg?.querySelector('path')
      expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12')
    })
  })
})
