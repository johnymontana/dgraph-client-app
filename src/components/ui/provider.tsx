'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ReactNode, useState, useEffect } from 'react'
import { ColorModeProvider } from './color-mode'
import { devToolTheme } from './theme'

// Create a custom theme by merging with the default system
const customTheme = {
  ...defaultSystem,
  ...devToolTheme,
}

interface ProviderProps {
  children: ReactNode
}

export function Provider({ children }: ProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering on client
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: '#f7fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
            DGraph Client
          </div>
          <div style={{ fontSize: '16px', color: '#666' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ColorModeProvider>
      <ChakraProvider value={customTheme}>
        {children}
      </ChakraProvider>
    </ColorModeProvider>
  )
}
