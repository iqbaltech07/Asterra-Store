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
        background: '#EEF3F9',
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.65)',
          secondary: 'rgba(255, 255, 255, 0.45)',
          raised: 'rgba(255, 255, 255, 0.78)',
          hover: 'rgba(255, 255, 255, 0.85)',
          muted: 'rgba(241, 245, 249, 0.60)',
          dark: '#111318',
          darkMuted: '#191C22',
        },
        sidebar: {
          DEFAULT: '#111318',
          surface: '#191C22',
          active: '#303844',
          border: 'rgba(255, 255, 255, 0.10)',
          text: '#F4F7FB',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.78)',
          subtle: 'rgba(255, 255, 255, 0.50)',
          strong: 'rgba(148, 163, 184, 0.25)',
        },
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
          hover: '#1D4ED8',
          soft: 'rgba(37, 99, 235, 0.08)',
          dark: '#1E40AF',
        },
        foreground: {
          DEFAULT: '#10213D',
          secondary: '#6680A8',
          muted: '#8496B0',
          subtle: '#94A3B8',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          pink: '#EC4899',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: 'rgba(255, 255, 255, 0.96)',
          foreground: '#10213D',
        },
        input: 'rgba(255, 255, 255, 0.85)',
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.65)',
          foreground: '#10213D',
        },
        status: {
          success: '#16A36A',
          warning: '#D97706',
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
        editorial: '0 8px 30px -4px rgba(31, 55, 90, 0.06), 0 2px 6px -1px rgba(31, 55, 90, 0.03)',
        subtle: '0 1px 3px rgba(31, 55, 90, 0.04), 0 1px 2px rgba(31, 55, 90, 0.02)',
        card: '0 8px 24px -4px rgba(31, 55, 90, 0.05), 0 2px 6px -1px rgba(31, 55, 90, 0.03)',
        'card-hover': '0 14px 34px -4px rgba(31, 55, 90, 0.09), 0 4px 10px -2px rgba(31, 55, 90, 0.04)',
        glass: '0 8px 32px 0 rgba(31, 55, 90, 0.06)',
        navbar: '0 4px 20px -2px rgba(31, 55, 90, 0.04)',
        dropdown: '0 10px 25px -5px rgba(31, 55, 90, 0.08), 0 8px 10px -6px rgba(31, 55, 90, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
