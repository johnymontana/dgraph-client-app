'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ReactNode } from 'react'
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
  return (
    <ColorModeProvider>
      <ChakraProvider value={customTheme}>
        {children}
      </ChakraProvider>
    </ColorModeProvider>
  )
}
