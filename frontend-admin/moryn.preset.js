/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111318',
          surface: '#191C22',
          blue: '#2563EB',
          purple: '#8B5CF6',
        },
        background: '#EEF3F9',
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.65)',
          secondary: 'rgba(255, 255, 255, 0.45)',
          raised: 'rgba(255, 255, 255, 0.78)',
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
        foreground: {
          DEFAULT: '#10213D',
          secondary: '#6680A8',
          muted: '#8496B0',
          subtle: '#94A3B8',
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
        accent: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
          hover: '#7C3AED',
          pink: '#EC4899',
        },
        status: {
          success: '#16A36A',
          warning: '#D97706',
          danger: '#EF4444',
          error: '#EF4444',
          info: '#2563EB',
        },
        moryn: {
          bg: '#EEF3F9',
          surface: 'rgba(255, 255, 255, 0.65)',
          elevated: 'rgba(255, 255, 255, 0.78)',
          ink: '#10213D',
          border: 'rgba(255, 255, 255, 0.78)',
          accent: '#2563EB',
          text: {
            primary: '#10213D',
            muted: '#6680A8',
            dim: '#8496B0',
          },
          status: {
            success: '#16A36A',
            warning: '#D97706',
            error: '#EF4444',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
    },
  },
};
