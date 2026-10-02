/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#121A2A',
          orange: '#C96F55',
          coral: '#C96F55',
        },
        background: '#F7F5EF',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F0ECE1',
          raised: '#FFFFFF',
        },
        foreground: {
          DEFAULT: '#121A2A',
          secondary: '#4A566A',
          muted: '#5F6C80',
          subtle: '#8C97A8',
        },
        border: {
          DEFAULT: 'rgba(18, 26, 42, 0.1)',
          subtle: 'rgba(18, 26, 42, 0.06)',
          strong: 'rgba(18, 26, 42, 0.2)',
        },
        primary: {
          DEFAULT: '#C96F55',
          foreground: '#F7F5EF',
        },
        accent: {
          DEFAULT: '#C96F55',
          dark: '#A9553E',
          soft: 'rgba(201, 111, 85, 0.08)',
          foreground: '#F7F5EF',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          error: '#DC2626',
          info: '#2563EB',
        },
        moryn: {
          bg: '#F7F5EF',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          ink: '#121A2A',
          border: 'rgba(18, 26, 42, 0.1)',
          accent: '#C96F55',
          text: {
            primary: '#121A2A',
            muted: '#5F6C80',
            dim: '#8C97A8',
          },
          status: {
            success: '#16A34A',
            warning: '#D97706',
            error: '#DC2626',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sharp: '2px',
        subtle: '6px',
        card: '12px',
        input: '8px',
        pill: '9999px',
      },
    },
  },
};
