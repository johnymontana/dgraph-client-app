// Custom theme for development tools
export const devToolTheme = {
  semanticTokens: {
    colors: {
      // Background colors
      'bg.primary': { _light: 'gray.50', _dark: 'gray.950' },
      'bg.secondary': { _light: 'white', _dark: 'gray.900' },
      'bg.tertiary': { _light: 'gray.100', _dark: 'gray.800' },
      'bg.sidebar': { _light: 'white', _dark: 'gray.900' },
      'bg.toolbar': { _light: 'white', _dark: 'gray.900' },
      'bg.panel': { _light: 'white', _dark: 'gray.800' },
      'bg.code': { _light: 'gray.50', _dark: 'gray.900' },
      
      // Foreground colors
      'fg.primary': { _light: 'gray.900', _dark: 'white' },
      'fg.secondary': { _light: 'gray.700', _dark: 'gray.300' },
      'fg.tertiary': { _light: 'gray.500', _dark: 'gray.400' },
      'fg.muted': { _light: 'gray.400', _dark: 'gray.500' },
      
      // Border colors
      'border.primary': { _light: 'gray.200', _dark: 'gray.700' },
      'border.secondary': { _light: 'gray.100', _dark: 'gray.800' },
      'border.accent': { _light: 'blue.200', _dark: 'blue.700' },
      
      // Accent colors
      'accent.primary': { _light: 'blue.600', _dark: 'blue.400' },
      'accent.secondary': { _light: 'blue.500', _dark: 'blue.300' },
      'accent.success': { _light: 'green.600', _dark: 'green.400' },
      'accent.warning': { _light: 'orange.600', _dark: 'orange.400' },
      'accent.error': { _light: 'red.600', _dark: 'red.400' },
      
      // Status colors
      'status.connected': { _light: 'green.500', _dark: 'green.400' },
      'status.disconnected': { _light: 'red.500', _dark: 'red.400' },
      'status.loading': { _light: 'blue.500', _dark: 'blue.400' },
    },
    shadows: {
      'shadow.sm': { _light: '0 1px 2px 0 rgb(0 0 0 / 0.05)', _dark: '0 1px 2px 0 rgb(0 0 0 / 0.3)' },
      'shadow.md': { _light: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', _dark: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)' },
      'shadow.lg': { _light: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', _dark: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)' },
      'shadow.xl': { _light: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', _dark: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)' },
    }
  },
  layerStyles: {
    'sidebar': {
      bg: 'bg.sidebar',
      borderRight: '1px solid',
      borderColor: 'border.primary',
      shadow: 'shadow.lg',
    },
    'toolbar': {
      bg: 'bg.toolbar',
      borderBottom: '1px solid',
      borderColor: 'border.primary',
      shadow: 'shadow.sm',
    },
    'panel': {
      bg: 'bg.panel',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'md',
      shadow: 'shadow.sm',
    },
    'code-editor': {
      bg: 'bg.code',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'md',
      fontFamily: 'mono',
    },
    'status-badge': {
      px: 2,
      py: 1,
      borderRadius: 'full',
      fontSize: 'xs',
      fontWeight: 'medium',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
    }
  },
  textStyles: {
    'code': {
      fontFamily: 'mono',
      fontSize: 'sm',
      lineHeight: 'tall',
    },
    'label': {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'fg.secondary',
    },
    'caption': {
      fontSize: 'xs',
      color: 'fg.tertiary',
    }
  }
}

// Custom component styles - simplified for v3 compatibility
export const buttonTheme = {
  variants: {
    'toolbar': {
      bg: 'transparent',
      color: 'fg.secondary',
      _hover: {
        bg: 'bg.tertiary',
        color: 'fg.primary',
      },
      _active: {
        bg: 'bg.tertiary',
      },
      _selected: {
        bg: 'accent.primary',
        color: 'white',
      }
    },
    'sidebar': {
      w: 'full',
      justifyContent: 'start',
      bg: 'transparent',
      color: 'fg.secondary',
      _hover: {
        bg: 'bg.tertiary',
        color: 'fg.primary',
      },
      _active: {
        bg: 'bg.tertiary',
      },
      _selected: {
        bg: 'accent.primary',
        color: 'white',
      }
    }
  }
}

export const cardTheme = {
  variants: {
    'sidebar': {
      bg: 'bg.sidebar',
      border: 'none',
      shadow: 'none',
      borderRadius: 0,
    },
    'panel': {
      bg: 'bg.panel',
      border: '1px solid',
      borderColor: 'border.primary',
      shadow: 'shadow.sm',
    }
  }
}
