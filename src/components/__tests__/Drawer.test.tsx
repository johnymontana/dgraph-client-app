import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import Drawer from '../Drawer'

// Mock Headless UI components
jest.mock('@headlessui/react', () => ({
  Dialog: ({ children, open, onClose }: any) => 
    open ? <div data-testid="drawer-overlay">{children}</div> : null,
  Transition: {
    Child: ({ children }: any) => <div data-testid="transition-child">{children}</div>,
    Root: ({ children, show }: any) => show ? <div data-testid="transition-root">{children}</div> : null
  }
}))

describe('Drawer', () => {
  const defaultProps = {
    isOpen: false,
    onClose: jest.fn(),
    title: 'Test Drawer',
    children: <div data-testid="drawer-content">Drawer content here</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(<Drawer {...defaultProps} />)
      
      expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument()
      expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument()
    })

    it('should render title correctly', () => {
      render(<Drawer {...defaultProps} isOpen={true} title="Custom Title" />)
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('should render children content', () => {
      const customChildren = <div data-testid="custom-content">Custom content</div>
      render(<Drawer {...defaultProps} isOpen={true} children={customChildren} />)
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.getByText('Custom content')).toBeInTheDocument()
    })
  })

  describe('header functionality', () => {
    it('should render close button', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should have proper close button accessibility', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close drawer')
    })

    it('should handle keyboard events on close button', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      
      // Enter key
      fireEvent.keyDown(closeButton, { key: 'Enter' })
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      
      // Space key
      fireEvent.keyDown(closeButton, { key: ' ' })
      expect(defaultProps.onClose).toHaveBeenCalledTimes(2)
    })
  })

  describe('overlay functionality', () => {
    it('should call onClose when overlay is clicked', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const overlay = screen.getByTestId('drawer-overlay')
      fireEvent.click(overlay)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when drawer content is clicked', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const content = screen.getByTestId('drawer-content')
      fireEvent.click(content)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('keyboard navigation', () => {
    it('should handle Escape key to close drawer', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close on other key presses', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      fireEvent.keyDown(document, { key: 'Tab' })
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const drawer = screen.getByTestId('drawer-overlay')
      expect(drawer).toHaveAttribute('role', 'dialog')
      expect(drawer).toHaveAttribute('aria-modal', 'true')
    })

    it('should have proper focus management', () => {
      render(<Drawer {...defaultProps} isOpen={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toHaveAttribute('tabIndex', '0')
    })

    it('should have descriptive text for screen readers', () => {
      render(<Drawer {...defaultProps} isOpen={true} title="Important Information" />)
      
      expect(screen.getByText('Important Information')).toBeInTheDocument()
    })
  })

  describe('content rendering', () => {
    it('should render complex children content', () => {
      const complexChildren = (
        <div>
          <h2>Section Title</h2>
          <p>This is a paragraph with some text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <button>Action Button</button>
        </div>
      )
      
      render(<Drawer {...defaultProps} isOpen={true} children={complexChildren} />)
      
      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('This is a paragraph with some text.')).toBeInTheDocument()
      expect(screen.getByText('List item 1')).toBeInTheDocument()
      expect(screen.getByText('List item 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
    })

    it('should handle functional children', () => {
      const FunctionalChild = () => <div data-testid="functional-child">Functional content</div>
      
      render(<Drawer {...defaultProps} isOpen={true} children={<FunctionalChild />} />)
      
      expect(screen.getByTestId('functional-child')).toBeInTheDocument()
      expect(screen.getByText('Functional content')).toBeInTheDocument()
    })

    it('should handle null children gracefully', () => {
      render(<Drawer {...defaultProps} isOpen={true} children={null} />)
      
      expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument()
    })
  })

  describe('state management', () => {
    it('should handle opening and closing', () => {
      const { rerender } = render(<Drawer {...defaultProps} />)
      
      // Initially closed
      expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument()
      
      // Open drawer
      rerender(<Drawer {...defaultProps} isOpen={true} />)
      expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument()
      
      // Close drawer
      rerender(<Drawer {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument()
    })

    it('should maintain content when toggling open state', () => {
      const { rerender } = render(<Drawer {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument()
      
      rerender(<Drawer {...defaultProps} isOpen={false} />)
      rerender(<Drawer {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle rapid open/close toggles', () => {
      const { rerender } = render(<Drawer {...defaultProps} />)
      
      // Rapid toggles
      rerender(<Drawer {...defaultProps} isOpen={true} />)
      rerender(<Drawer {...defaultProps} isOpen={false} />)
      rerender(<Drawer {...defaultProps} isOpen={true} />)
      rerender(<Drawer {...defaultProps} isOpen={false} />)
      rerender(<Drawer {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument()
    })

    it('should handle onClose being undefined', () => {
      const propsWithoutOnClose = { ...defaultProps }
      delete propsWithoutOnClose.onClose
      
      expect(() => {
        render(<Drawer {...propsWithoutOnClose} isOpen={true} />)
      }).not.toThrow()
    })

    it('should handle very long titles', () => {
      const longTitle = 'This is a very long title that exceeds normal length limits and should be handled gracefully without breaking the layout or causing any visual issues'
      
      render(<Drawer {...defaultProps} isOpen={true} title={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle special characters in title', () => {
      const specialTitle = 'Title with special chars: !@#$%^&*()_+-=[]{}|;\\\'":",./<>?'
      
      render(<Drawer {...defaultProps} isOpen={true} title={specialTitle} />)
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })
  })

  describe('performance', () => {
    it('should handle large content efficiently', () => {
      const largeContent = (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i} data-testid={`item-${i}`}>
              Item {i}: This is a very long content item that repeats many times to test performance
            </div>
          ))}
        </div>
      )
      
      const startTime = performance.now()
      render(<Drawer {...defaultProps} isOpen={true} children={largeContent} />)
      const endTime = performance.now()
      
      // Should render 1000 items in reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500)
      expect(screen.getByTestId('item-0')).toBeInTheDocument()
      expect(screen.getByTestId('item-999')).toBeInTheDocument()
    })
  })
})
