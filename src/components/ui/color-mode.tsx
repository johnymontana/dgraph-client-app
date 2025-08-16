'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

type ColorMode = 'light' | 'dark' | 'system'

interface ColorModeContextValue {
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
  toggleColorMode: () => void
  isLight: boolean
  isDark: boolean
}

const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined)

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const colorMode = (theme as ColorMode) || 'system'
  const isLight = mounted && resolvedTheme === 'light'
  const isDark = mounted && resolvedTheme === 'dark'

  const setColorMode = (mode: ColorMode) => {
    setTheme(mode)
  }

  const toggleColorMode = () => {
    setTheme(isLight ? 'dark' : 'light')
  }

  const value: ColorModeContextValue = {
    colorMode,
    setColorMode,
    toggleColorMode,
    isLight,
    isDark,
  }

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  const context = useContext(ColorModeContext)
  if (context === undefined) {
    throw new Error('useColorMode must be used within a ColorModeProvider')
  }
  return context
}

export function useColorModeValue<T>(lightValue: T, darkValue: T): T {
  const { isLight, isDark } = useColorMode()
  
  if (isLight) return lightValue
  if (isDark) return darkValue
  
  // Default to light mode if not mounted yet
  return lightValue
}
