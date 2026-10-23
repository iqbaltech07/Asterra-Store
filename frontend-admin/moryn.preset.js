/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111111',
          surface: '#1B1B1B',
          blue: '#2563EB',
          purple: '#8B5CF6',
        },
        background: '#F4F5F7',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F9FB',
          raised: '#FFFFFF',
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
        foreground: {
          DEFAULT: '#171717',
          secondary: '#666A73',
          muted: '#90949C',
          subtle: '#A3A3A3',
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
        accent: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
          hover: '#7C3AED',
          pink: '#EC4899',
        },
        status: {
          success: '#16A36A',
          warning: '#F59E0B',
          danger: '#EF4444',
          error: '#EF4444',
          info: '#2563EB',
        },
        moryn: {
          bg: '#F4F5F7',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          ink: '#171717',
          border: '#E5E7EB',
          accent: '#2563EB',
          text: {
            primary: '#171717',
            muted: '#666A73',
            dim: '#90949C',
          },
          status: {
            success: '#16A36A',
            warning: '#F59E0B',
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
