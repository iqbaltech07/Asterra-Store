/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#171A18',
          orange: '#C66543',
        },
        background: '#F7F5F0',
        surface: {
          DEFAULT: '#FCFBF8',
          raised: '#FFFFFF',
        },
        foreground: {
          DEFAULT: '#171A18',
          secondary: '#303633',
          muted: '#707874',
          subtle: '#B9BFBB',
        },
        border: {
          DEFAULT: '#D9DDD8',
          subtle: '#E8EBE8',
          strong: '#B9BFBB',
        },
        primary: {
          DEFAULT: '#171A18',
          foreground: '#FCFBF8',
        },
        accent: {
          DEFAULT: '#C66543',
          dark: '#A94F32',
          soft: '#F1DFD7',
          foreground: '#FFFFFF',
        },
        status: {
          success: '#2F6B4F',
          warning: '#A56A21',
          danger: '#B4433A',
          error: '#B4433A',
          info: '#486875',
        },
        moryn: {
          bg: '#F7F5F0',
          surface: '#FCFBF8',
          elevated: '#FFFFFF',
          ink: '#171A18',
          border: '#D9DDD8',
          accent: '#C66543',
          text: {
            primary: '#171A18',
            muted: '#707874',
            dim: '#B9BFBB',
          },
          status: {
            success: '#2F6B4F',
            warning: '#A56A21',
            error: '#B4433A',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sharp: '2px',
        subtle: '4px',
        card: '8px',
        input: '6px',
        pill: '9999px',
      },
    },
  },
};
