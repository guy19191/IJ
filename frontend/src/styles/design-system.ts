export const colors = {
  // Primary colors with a modern, tech-forward feel
  primary: {
    50: '#E6F7FF',
    100: '#BAE7FF',
    200: '#91D5FF',
    300: '#69C0FF',
    400: '#40A9FF',
    500: '#1890FF',
    600: '#096DD9',
    700: '#0050B3',
    800: '#003A8C',
    900: '#002766',
  },
  // Neutral colors with a slight blue tint for a tech feel
  neutral: {
    50: '#F5F7FA',
    100: '#E4E7EB',
    200: '#CBD2D9',
    300: '#9AA5B1',
    400: '#7B8794',
    500: '#616E7C',
    600: '#52606D',
    700: '#3E4C59',
    800: '#323F4B',
    900: '#1F2933',
  },
  // Accent colors for AI interactions and highlights
  accent: {
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#F5222D',
    info: '#1890FF',
  },
  // Glass morphism background colors
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
};

export const animations = {
  // Smooth transitions for UI elements
  transition: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  // Loading and processing animations
  loading: {
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite',
    bounce: 'bounce 1s infinite',
  },
};

export const shadows = {
  // Modern, subtle shadows for depth
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  // Glass effect shadows
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
};

export const typography = {
  // Modern, clean font stack
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  // Responsive font sizes
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
};

export const spacing = {
  // Consistent spacing scale
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
};

export const borderRadius = {
  // Modern border radius scale
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Glass morphism styles
export const glassMorphism = {
  backdrop: 'backdrop-blur-md',
  border: 'border border-white/20',
  shadow: 'shadow-glass',
};

// AI interaction styles
export const aiInteraction = {
  pulse: 'animate-pulse',
  glow: 'shadow-[0_0_15px_rgba(24,144,255,0.5)]',
  highlight: 'bg-primary-500/10',
}; 