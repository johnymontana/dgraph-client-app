// Modern development tool theme
export const devToolTheme = {
  semanticTokens: {
    colors: {
      // Background colors - more sophisticated grays
      'bg.primary': { _light: '#fafafa', _dark: '#0a0a0a' },
      'bg.secondary': { _light: '#ffffff', _dark: '#111111' },
      'bg.tertiary': { _light: '#f4f4f5', _dark: '#1a1a1a' },
      'bg.sidebar': { _light: '#ffffff', _dark: '#111111' },
      'bg.toolbar': { _light: '#ffffff', _dark: '#111111' },
      'bg.panel': { _light: '#ffffff', _dark: '#111111' },
      'bg.code': { _light: '#f8f9fa', _dark: '#0d1117' },
      'bg.hover': { _light: '#f4f4f5', _dark: '#1a1a1a' },
      'bg.active': { _light: '#e4e4e7', _dark: '#262626' },
      'bg.muted': { _light: '#f9f9fb', _dark: '#161616' },
      
      // Foreground colors - better contrast
      'fg.primary': { _light: '#18181b', _dark: '#fafafa' },
      'fg.secondary': { _light: '#71717a', _dark: '#a1a1aa' },
      'fg.tertiary': { _light: '#a1a1aa', _dark: '#71717a' },
      'fg.muted': { _light: '#d4d4d8', _dark: '#52525b' },
      'fg.subtle': { _light: '#e4e4e7', _dark: '#3f3f46' },
      
      // Border colors - refined hierarchy
      'border.primary': { _light: '#e4e4e7', _dark: '#262626' },
      'border.secondary': { _light: '#f4f4f5', _dark: '#1a1a1a' },
      'border.accent': { _light: '#3b82f6', _dark: '#60a5fa' },
      'border.muted': { _light: '#f1f5f9', _dark: '#1e293b' },
      
      // Accent colors - modern blue palette
      'accent.primary': { _light: '#2563eb', _dark: '#3b82f6' },
      'accent.secondary': { _light: '#1d4ed8', _dark: '#60a5fa' },
      'accent.hover': { _light: '#1e40af', _dark: '#93c5fd' },
      'accent.subtle': { _light: '#eff6ff', _dark: '#1e293b' },
      
      // Status colors - professional palette
      'status.success': { _light: '#059669', _dark: '#10b981' },
      'status.warning': { _light: '#d97706', _dark: '#f59e0b' },
      'status.error': { _light: '#dc2626', _dark: '#ef4444' },
      'status.info': { _light: '#0284c7', _dark: '#0ea5e9' },
      'status.connected': { _light: '#059669', _dark: '#10b981' },
      'status.disconnected': { _light: '#dc2626', _dark: '#ef4444' },
      'status.loading': { _light: '#0284c7', _dark: '#0ea5e9' },
      
      // Interactive colors
      'interactive.primary': { _light: '#2563eb', _dark: '#3b82f6' },
      'interactive.hover': { _light: '#1d4ed8', _dark: '#60a5fa' },
      'interactive.active': { _light: '#1e40af', _dark: '#93c5fd' },
      'interactive.disabled': { _light: '#d1d5db', _dark: '#374151' },
    },
    shadows: {
      'shadow.xs': { _light: '0 1px 2px 0 rgb(0 0 0 / 0.05)', _dark: '0 1px 2px 0 rgb(0 0 0 / 0.1)' },
      'shadow.sm': { _light: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', _dark: '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.2)' },
      'shadow.md': { _light: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', _dark: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)' },
      'shadow.lg': { _light: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', _dark: '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2)' },
      'shadow.xl': { _light: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', _dark: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2)' },
      'shadow.focus': { _light: '0 0 0 3px rgb(37 99 235 / 0.1)', _dark: '0 0 0 3px rgb(59 130 246 / 0.2)' },
    },
    spacing: {
      'spacing.xs': '0.25rem',
      'spacing.sm': '0.5rem', 
      'spacing.md': '1rem',
      'spacing.lg': '1.5rem',
      'spacing.xl': '2rem',
      'spacing.2xl': '3rem',
    }
  },
  layerStyles: {
    'sidebar': {
      bg: 'bg.sidebar',
      borderRight: '1px solid',
      borderColor: 'border.primary',
      shadow: 'shadow.sm',
      backdropFilter: 'blur(8px)',
    },
    'toolbar': {
      bg: 'bg.toolbar',
      borderBottom: '1px solid',
      borderColor: 'border.primary',
      shadow: 'shadow.xs',
      backdropFilter: 'blur(8px)',
      backdropSaturate: '180%',
    },
    'panel': {
      bg: 'bg.panel',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      shadow: 'shadow.sm',
    },
    'card.elevated': {
      bg: 'bg.secondary',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      shadow: 'shadow.sm',
      _hover: {
        shadow: 'shadow.md',
        borderColor: 'border.accent',
      },
      transition: 'all 0.2s ease-in-out',
    },
    'code-editor': {
      bg: 'bg.code',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      fontFamily: 'mono',
      fontSize: 'sm',
      lineHeight: '1.6',
      _focus: {
        borderColor: 'border.accent',
        shadow: 'shadow.focus',
      },
    },
    'status-badge': {
      px: 3,
      py: 1.5,
      borderRadius: 'full',
      fontSize: 'xs',
      fontWeight: 'semibold',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1.5,
    },
    'nav-item': {
      w: 'full',
      justifyContent: 'flex-start',
      bg: 'transparent',
      color: 'fg.secondary',
      borderRadius: 'md',
      px: 3,
      py: 2.5,
      fontSize: 'sm',
      fontWeight: 'medium',
      transition: 'all 0.15s ease-in-out',
      _hover: {
        bg: 'bg.hover',
        color: 'fg.primary',
        transform: 'translateX(2px)',
      },
      _active: {
        bg: 'bg.active',
        transform: 'translateX(1px)',
      },
      _focus: {
        outline: '2px solid',
        outlineColor: 'accent.primary',
        outlineOffset: '1px',
      },
    },
    'nav-item.active': {
      bg: 'accent.primary',
      color: 'white',
      _hover: {
        bg: 'accent.hover',
        color: 'white',
        transform: 'translateX(2px)',
      },
    },
  },
  textStyles: {
    'heading.page': {
      fontSize: { base: 'xl', md: '2xl' },
      fontWeight: 'bold',
      color: 'fg.primary',
      lineHeight: 'shorter',
      letterSpacing: '-0.025em',
    },
    'heading.section': {
      fontSize: { base: 'lg', md: 'xl' },
      fontWeight: 'semibold',
      color: 'fg.primary',
      lineHeight: 'short',
    },
    'heading.card': {
      fontSize: { base: 'md', md: 'lg' },
      fontWeight: 'semibold',
      color: 'fg.primary',
      lineHeight: 'short',
    },
    'body.large': {
      fontSize: { base: 'sm', md: 'md' },
      color: 'fg.primary',
      lineHeight: 'base',
    },
    'body.medium': {
      fontSize: 'sm',
      color: 'fg.secondary',
      lineHeight: 'base',
    },
    'body.small': {
      fontSize: 'xs',
      color: 'fg.tertiary',
      lineHeight: 'base',
    },
    'code.inline': {
      fontFamily: 'mono',
      fontSize: 'xs',
      bg: 'bg.muted',
      px: 1.5,
      py: 0.5,
      borderRadius: 'sm',
      color: 'accent.primary',
    },
    'code.block': {
      fontFamily: 'mono',
      fontSize: 'sm',
      lineHeight: '1.6',
      bg: 'bg.code',
      p: 4,
      borderRadius: 'lg',
      border: '1px solid',
      borderColor: 'border.primary',
    },
    'label': {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: 'fg.primary',
      lineHeight: 'short',
    },
    'caption': {
      fontSize: 'xs',
      color: 'fg.tertiary',
      lineHeight: 'short',
    },
    'helper': {
      fontSize: 'xs',
      color: 'fg.muted',
      lineHeight: 'short',
    }
  }
}

// Modern button theme variations
export const buttonTheme = {
  variants: {
    'toolbar': {
      bg: 'transparent',
      color: 'fg.secondary',
      borderRadius: 'md',
      px: 3,
      py: 2,
      fontSize: 'sm',
      fontWeight: 'medium',
      transition: 'all 0.15s ease-in-out',
      _hover: {
        bg: 'bg.hover',
        color: 'fg.primary',
        transform: 'translateY(-1px)',
        shadow: 'shadow.sm',
      },
      _active: {
        bg: 'bg.active',
        transform: 'translateY(0px)',
      },
      _focus: {
        outline: '2px solid',
        outlineColor: 'accent.primary',
        outlineOffset: '1px',
      },
      _selected: {
        bg: 'accent.primary',
        color: 'white',
        _hover: {
          bg: 'accent.hover',
          color: 'white',
        }
      }
    },
    'primary': {
      bg: 'accent.primary',
      color: 'white',
      borderRadius: 'lg',
      px: 4,
      py: 2.5,
      fontSize: 'sm',
      fontWeight: 'semibold',
      transition: 'all 0.15s ease-in-out',
      _hover: {
        bg: 'accent.hover',
        transform: 'translateY(-1px)',
        shadow: 'shadow.md',
      },
      _active: {
        transform: 'translateY(0px)',
        shadow: 'shadow.sm',
      },
      _focus: {
        outline: '2px solid',
        outlineColor: 'accent.primary',
        outlineOffset: '2px',
      },
      _disabled: {
        bg: 'interactive.disabled',
        color: 'fg.muted',
        cursor: 'not-allowed',
        transform: 'none',
        shadow: 'none',
      }
    },
    'secondary': {
      bg: 'bg.secondary',
      color: 'fg.primary',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      px: 4,
      py: 2.5,
      fontSize: 'sm',
      fontWeight: 'medium',
      transition: 'all 0.15s ease-in-out',
      _hover: {
        bg: 'bg.hover',
        borderColor: 'border.accent',
        transform: 'translateY(-1px)',
        shadow: 'shadow.sm',
      },
      _active: {
        bg: 'bg.active',
        transform: 'translateY(0px)',
      },
      _focus: {
        outline: '2px solid',
        outlineColor: 'accent.primary',
        outlineOffset: '1px',
      }
    },
    'ghost': {
      bg: 'transparent',
      color: 'fg.secondary',
      borderRadius: 'md',
      px: 3,
      py: 2,
      fontSize: 'sm',
      fontWeight: 'medium',
      transition: 'all 0.15s ease-in-out',
      _hover: {
        bg: 'bg.hover',
        color: 'fg.primary',
      },
      _active: {
        bg: 'bg.active',
      },
      _focus: {
        outline: '2px solid',
        outlineColor: 'accent.primary',
        outlineOffset: '1px',
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
      borderRadius: 'lg',
      shadow: 'shadow.sm',
      p: 6,
    },
    'elevated': {
      bg: 'bg.secondary',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      shadow: 'shadow.sm',
      p: 6,
      transition: 'all 0.2s ease-in-out',
      _hover: {
        shadow: 'shadow.md',
        borderColor: 'border.accent',
      }
    },
    'flat': {
      bg: 'bg.muted',
      border: '1px solid',
      borderColor: 'border.secondary',
      borderRadius: 'md',
      shadow: 'none',
      p: 4,
    }
  }
}

// Input field theme
export const inputTheme = {
  variants: {
    'default': {
      bg: 'bg.secondary',
      border: '1px solid',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      px: 3,
      py: 2.5,
      fontSize: 'sm',
      color: 'fg.primary',
      transition: 'all 0.15s ease-in-out',
      _placeholder: {
        color: 'fg.muted',
      },
      _focus: {
        borderColor: 'border.accent',
        shadow: 'shadow.focus',
        outline: 'none',
      },
      _invalid: {
        borderColor: 'status.error',
        shadow: '0 0 0 3px rgb(220 38 38 / 0.1)',
      }
    }
  }
}
