/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B1A2E',
          orange: '#E96F3D',
        },
        background: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F7F9FB',
          raised: '#FFFFFF',
        },
        foreground: {
          DEFAULT: '#0B1A2E',
          secondary: '#607085',
          muted: '#8793A3',
          subtle: '#CBD5E1',
        },
        border: {
          DEFAULT: '#E2E8F0',
          subtle: '#EEF2F6',
          strong: '#CBD5E1',
        },
        primary: {
          DEFAULT: '#E96F3D',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#E96F3D',
          dark: '#C95B3C',
          soft: '#FFF0E9',
          foreground: '#FFFFFF',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          error: '#DC2626',
          info: '#2563EB',
        },
        moryn: {
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          ink: '#0B1A2E',
          border: '#E2E8F0',
          accent: '#E96F3D',
          text: {
            primary: '#0B1A2E',
            muted: '#8793A3',
            dim: '#CBD5E1',
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
