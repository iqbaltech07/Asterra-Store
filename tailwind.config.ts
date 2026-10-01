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
          secondary: '#F7F9FB',
          raised: '#FFFFFF',
          hover: '#F8FAFC',
          muted: '#F1F5F9',
        },
        navy: {
          DEFAULT: '#0B1A2E',
          950: '#071321',
          900: '#0B1A2E',
          800: '#102238',
          700: '#152B43',
          border: '#1E3550',
          subtle: '#263D5C',
        },
        border: {
          DEFAULT: '#E2E8F0',
          subtle: '#EEF2F6',
          strong: '#CBD5E1',
          navy: '#1E3550',
        },
        primary: {
          DEFAULT: '#E96F3D',
          foreground: '#FFFFFF',
          hover: '#F27E4A',
          soft: '#FFF0E9',
          dark: '#C95B3C',
          navy: '#0B1A2E',
        },
        ink: {
          DEFAULT: '#0B1A2E',
          soft: '#1E293B',
          muted: '#607085',
        },
        foreground: {
          DEFAULT: '#0B1A2E',
          secondary: '#607085',
          muted: '#8793A3',
          subtle: '#CBD5E1',
        },
        accent: {
          DEFAULT: '#E96F3D',
          hover: '#F27E4A',
          dark: '#C95B3C',
          soft: '#FFF0E9',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#0B1A2E',
        },
        input: '#E2E8F0',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0B1A2E',
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
        editorial: '0 4px 20px -2px rgba(11, 26, 46, 0.06), 0 2px 6px -1px rgba(11, 26, 46, 0.04)',
        subtle: '0 1px 3px rgba(11, 26, 46, 0.05), 0 1px 2px rgba(11, 26, 46, 0.03)',
        card: '0 1px 3px 0 rgba(11, 26, 46, 0.04), 0 1px 2px -1px rgba(11, 26, 46, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(11, 26, 46, 0.08), 0 4px 6px -2px rgba(11, 26, 46, 0.04)',
        navbar: '0 10px 30px -5px rgba(7, 19, 33, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
