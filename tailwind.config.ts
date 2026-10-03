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
        background: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFC',
          raised: '#FFFFFF',
          hover: '#F1F5F9',
          muted: '#E2E8F0',
        },
        navy: {
          DEFAULT: '#121A2A',
          950: '#0C121E',
          900: '#121A2A',
          800: '#182235',
          700: '#1E2A40',
          border: 'rgba(255, 255, 255, 0.12)',
          subtle: 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          DEFAULT: 'rgba(18, 26, 42, 0.1)',
          subtle: 'rgba(18, 26, 42, 0.06)',
          strong: 'rgba(18, 26, 42, 0.2)',
          navy: 'rgba(255, 255, 255, 0.12)',
        },
        primary: {
          DEFAULT: '#C96F55',
          foreground: '#F7F5EF',
          hover: '#B86047',
          soft: 'rgba(201, 111, 85, 0.08)',
          dark: '#A9553E',
          navy: '#121A2A',
        },
        ink: {
          DEFAULT: '#121A2A',
          soft: '#23314B',
          muted: '#5F6C80',
        },
        foreground: {
          DEFAULT: '#121A2A',
          secondary: '#4A566A',
          muted: '#5F6C80',
          subtle: '#8C97A8',
        },
        accent: {
          DEFAULT: '#C96F55',
          hover: '#B86047',
          dark: '#A9553E',
          soft: 'rgba(201, 111, 85, 0.08)',
          foreground: '#F7F5EF',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#121A2A',
        },
        input: 'rgba(18, 26, 42, 0.12)',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#121A2A',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
          info: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        card: '12px',
        input: '8px',
        pill: '9999px',
      },
      boxShadow: {
        editorial: '0 4px 20px -2px rgba(18, 26, 42, 0.05), 0 2px 6px -1px rgba(18, 26, 42, 0.03)',
        subtle: '0 1px 3px rgba(18, 26, 42, 0.04), 0 1px 2px rgba(18, 26, 42, 0.02)',
        card: '0 1px 3px 0 rgba(18, 26, 42, 0.03), 0 1px 2px -1px rgba(18, 26, 42, 0.02)',
        'card-hover': '0 8px 20px -4px rgba(18, 26, 42, 0.06), 0 3px 6px -2px rgba(18, 26, 42, 0.03)',
        navbar: '0 8px 24px -4px rgba(18, 26, 42, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
