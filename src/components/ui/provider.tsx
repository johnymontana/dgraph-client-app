'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ReactNode } from 'react'
import { ColorModeProvider } from './color-mode'

// Using default Chakra UI system theme

interface ProviderProps {
  children: ReactNode
}

export function Provider({ children }: ProviderProps) {
  return (
    <ColorModeProvider>
      <ChakraProvider value={defaultSystem}>
        {children}
      </ChakraProvider>
    </ColorModeProvider>
  )
}
