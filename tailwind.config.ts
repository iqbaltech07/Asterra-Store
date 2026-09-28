import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [require('./moryn.preset.js')],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F5F0',
        surface: {
          DEFAULT: '#FCFBF8',
          raised: '#FFFFFF',
          hover: '#F1EFEA',
        },
        border: {
          DEFAULT: '#D9DDD8',
          subtle: '#E8EBE8',
          strong: '#B9BFBB',
        },
        primary: {
          DEFAULT: '#C66543',
          foreground: '#FFFFFF',
          hover: '#A94F32',
          dark: '#171A18',
        },
        ink: {
          DEFAULT: '#171A18',
          soft: '#303633',
        },
        foreground: {
          DEFAULT: '#171A18',
          muted: '#707874',
          subtle: '#B9BFBB',
        },
        accent: {
          DEFAULT: '#C66543',
          dark: '#A94F32',
          soft: '#F1DFD7',
        },
        status: {
          success: '#2F6B4F',
          warning: '#A56A21',
          error: '#B4433A',
          info: '#486875',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        card: '12px',
        input: '8px',
        pill: '9999px',
      },
      boxShadow: {
        editorial: '0 8px 30px rgba(23, 26, 24, 0.06)',
        subtle: '0 2px 8px rgba(23, 26, 24, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
