/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        maroon: {
          50: '#FDF5F5', 100: '#F5DADA', 200: '#E89898', 300: '#D45C5C',
          400: '#BB3535', 500: '#9B2424', 600: '#7B1C1C', 700: '#5A1818',
          800: '#4A1212', 900: '#2E0A0A', 950: '#1A0505',
        },
        gold: {
          50: '#FDFAF0', 100: '#F8EABB', 200: '#F0D080', 300: '#E6BC4A',
          400: '#D4A017', 500: '#C08000', 600: '#9A6200', 700: '#704500',
          800: '#4A2E00', 900: '#2C1A00',
        },
        surface: {
          page: 'var(--surface-page)',
          card: 'var(--surface-card)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          sidebar: 'var(--surface-sidebar)',
          'sidebar-hover': 'var(--surface-sidebar-hover)',
          'sidebar-active': 'var(--surface-sidebar-active)',
        },
        success: {
          bg: 'var(--success-bg)',
          text: 'var(--success-text)',
          border: 'var(--success-border)',
        },
        warning: {
          bg: 'var(--warning-bg)',
          text: 'var(--warning-text)',
          border: 'var(--warning-border)',
        },
        danger: {
          bg: 'var(--danger-bg)',
          text: 'var(--danger-text)',
          border: 'var(--danger-border)',
        },
        info: {
          bg: 'var(--info-bg)',
          text: 'var(--info-text)',
          border: 'var(--info-border)',
        },
      },
      boxShadow: {
        'bpc-sm': '0 1px 4px rgba(123,28,28,0.08)',
        'bpc':    '0 4px 16px rgba(123,28,28,0.10)',
        'bpc-lg': '0 8px 32px rgba(123,28,28,0.14)',
        'bpc-xl': '0 16px 48px rgba(123,28,28,0.18)',
        'gold':   '0 0 0 3px rgba(212,160,23,0.25)',
      },
      borderRadius: {
        'sm': '6px', 'md': '10px', 'lg': '16px', 'xl': '24px',
      },
      backgroundImage: {
        'diagonal-gold': `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 24px,
          rgba(212,160,23,0.025) 24px,
          rgba(212,160,23,0.025) 25px
        )`,
      },
      animation: {
        'count-up':    'countUp 1.2s cubic-bezier(0,0,0.2,1)',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':     'shimmer 1.6s infinite',
        'pulse-gold':  'pulseGold 2s infinite',
      },
      keyframes: {
        countUp:   { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '200% center' }, '100%': { backgroundPosition: '-200% center' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,160,23,0.4)' }, '50%': { boxShadow: '0 0 0 6px rgba(212,160,23,0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
