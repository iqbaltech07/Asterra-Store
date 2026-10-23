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
        background: '#F4F5F7',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F9FB',
          raised: '#FFFFFF',
          hover: '#F3F4F6',
          muted: '#E5E7EB',
          dark: '#111111',
          darkMuted: '#1B1B1B',
        },
        sidebar: {
          DEFAULT: '#111111',
          surface: '#1B1B1B',
          border: 'rgba(255, 255, 255, 0.10)',
          text: '#F5F5F5',
          muted: '#A3A3A3',
        },
        border: {
          DEFAULT: '#E5E7EB',
          subtle: '#F0F2F5',
          strong: '#D1D5DB',
        },
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
          hover: '#1D4ED8',
          soft: 'rgba(37, 99, 235, 0.08)',
          dark: '#1E40AF',
        },
        foreground: {
          DEFAULT: '#171717',
          secondary: '#666A73',
          muted: '#90949C',
          subtle: '#A3A3A3',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          pink: '#EC4899',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#171717',
        },
        input: '#E5E7EB',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#171717',
        },
        status: {
          success: '#16A36A',
          warning: '#F59E0B',
          error: '#EF4444',
          danger: '#EF4444',
          info: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '20px',
        card: '16px',
        input: '10px',
        pill: '9999px',
      },
      boxShadow: {
        editorial: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        subtle: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        navbar: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
        dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
