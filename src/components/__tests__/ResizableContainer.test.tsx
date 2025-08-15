import React from 'react'
import { render, screen, fireEvent } from '@/utils/test-utils'
import ResizableContainer from '../ResizableContainer'

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('ResizableContainer', () => {
  const defaultProps = {
    children: <div data-testid="child-content">Test Content</div>,
    minWidth: 200,
    maxWidth: 800,
    defaultWidth: 400,
    onResize: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render children content', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      expect(screen.getByTestId('resize-handle')).toBeInTheDocument()
    })

    it('should apply default width', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const container = screen.getByTestId('resizable-container')
      expect(container).toHaveStyle({ width: '400px' })
    })
  })

  describe('resize functionality', () => {
    it('should start resizing on mouse down', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      fireEvent.mouseDown(resizeHandle)
      
      expect(document.body).toHaveStyle({ cursor: 'col-resize' })
      expect(document.body).toHaveStyle({ userSelect: 'none' })
    })

    it('should handle mouse move during resize', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      const container = screen.getByTestId('resizable-container')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Move mouse to resize
      fireEvent.mouseMove(document, { clientX: 500 })
      
      // Should call onResize with new width
      expect(defaultProps.onResize).toHaveBeenCalledWith(500)
    })

    it('should stop resizing on mouse up', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Stop resize
      fireEvent.mouseUp(document)
      
      expect(document.body).not.toHaveStyle({ cursor: 'col-resize' })
      expect(document.body).not.toHaveStyle({ userSelect: 'none' })
    })

    it('should respect minimum width constraint', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      const container = screen.getByTestId('resizable-container')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Try to resize below minimum
      fireEvent.mouseMove(document, { clientX: 100 })
      
      // Should call onResize with minimum width
      expect(defaultProps.onResize).toHaveBeenCalledWith(200)
    })

    it('should respect maximum width constraint', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      const container = screen.getByTestId('resizable-container')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Try to resize above maximum
      fireEvent.mouseMove(document, { clientX: 1000 })
      
      // Should call onResize with maximum width
      expect(defaultProps.onResize).toHaveBeenCalledWith(800)
    })
  })

  describe('mouse interactions', () => {
    it('should handle mouse enter on resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      fireEvent.mouseEnter(resizeHandle)
      
      expect(resizeHandle).toHaveClass('hover:bg-blue-500')
    })

    it('should handle mouse leave on resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Enter first
      fireEvent.mouseEnter(resizeHandle)
      
      // Then leave
      fireEvent.mouseLeave(resizeHandle)
      
      // Should not have hover class
      expect(resizeHandle).not.toHaveClass('hover:bg-blue-500')
    })

    it('should handle mouse down outside resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const container = screen.getByTestId('resizable-container')
      
      fireEvent.mouseDown(container)
      
      // Should not start resizing
      expect(document.body).not.toHaveStyle({ cursor: 'col-resize' })
    })
  })

  describe('touch interactions', () => {
    it('should handle touch start on resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      fireEvent.touchStart(resizeHandle, {
        touches: [{ clientX: 400 }]
      })
      
      expect(document.body).toHaveStyle({ cursor: 'col-resize' })
      expect(document.body).toHaveStyle({ userSelect: 'none' })
    })

    it('should handle touch move during resize', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.touchStart(resizeHandle, {
        touches: [{ clientX: 400 }]
      })
      
      // Move touch to resize
      fireEvent.touchMove(document, {
        touches: [{ clientX: 500 }]
      })
      
      // Should call onResize with new width
      expect(defaultProps.onResize).toHaveBeenCalledWith(500)
    })

    it('should handle touch end', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.touchStart(resizeHandle, {
        touches: [{ clientX: 400 }]
      })
      
      // End resize
      fireEvent.touchEnd(document)
      
      expect(document.body).not.toHaveStyle({ cursor: 'col-resize' })
      expect(document.body).not.toHaveStyle({ userSelect: 'none' })
    })
  })

  describe('keyboard accessibility', () => {
    it('should handle Enter key on resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      fireEvent.keyDown(resizeHandle, { key: 'Enter' })
      
      // Should start resizing
      expect(document.body).toHaveStyle({ cursor: 'col-resize' })
    })

    it('should handle Space key on resize handle', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      fireEvent.keyDown(resizeHandle, { key: ' ' })
      
      // Should start resizing
      expect(document.body).toHaveStyle({ cursor: 'col-resize' })
    })

    it('should handle Escape key to cancel resize', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Cancel with Escape
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(document.body).not.toHaveStyle({ cursor: 'col-resize' })
    })
  })

  describe('edge cases', () => {
    it('should handle rapid mouse movements', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Rapid movements
      fireEvent.mouseMove(document, { clientX: 450 })
      fireEvent.mouseMove(document, { clientX: 500 })
      fireEvent.mouseMove(document, { clientX: 550 })
      fireEvent.mouseMove(document, { clientX: 600 })
      
      // Should call onResize multiple times
      expect(defaultProps.onResize).toHaveBeenCalledTimes(4)
    })

    it('should handle resize handle click without drag', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Click without moving
      fireEvent.mouseDown(resizeHandle)
      fireEvent.mouseUp(resizeHandle)
      
      // Should not call onResize
      expect(defaultProps.onResize).not.toHaveBeenCalled()
    })

    it('should handle window resize during resize operation', () => {
      render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Simulate window resize
      fireEvent.resize(window)
      
      // Should still be in resize mode
      expect(document.body).toHaveStyle({ cursor: 'col-resize' })
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<ResizableContainer {...defaultProps} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Unmount component
      unmount()
      
      // Should not have resize styles
      expect(document.body).not.toHaveStyle({ cursor: 'col-resize' })
    })
  })

  describe('responsive behavior', () => {
    it('should handle different default widths', () => {
      const propsWithDifferentWidth = { ...defaultProps, defaultWidth: 600 }
      
      render(<ResizableContainer {...propsWithDifferentWidth} />)
      
      const container = screen.getByTestId('resizable-container')
      expect(container).toHaveStyle({ width: '600px' })
    })

    it('should handle different min/max constraints', () => {
      const propsWithConstraints = {
        ...defaultProps,
        minWidth: 100,
        maxWidth: 1200
      }
      
      render(<ResizableContainer {...propsWithConstraints} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      
      // Start resize
      fireEvent.mouseDown(resizeHandle)
      
      // Try to resize below new minimum
      fireEvent.mouseMove(document, { clientX: 50 })
      
      // Should call onResize with new minimum width
      expect(defaultProps.onResize).toHaveBeenCalledWith(100)
    })
  })
})
