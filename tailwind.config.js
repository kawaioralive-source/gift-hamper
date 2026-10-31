/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        crimson: {
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#651010',
        },
        slate: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        halloween: {
          orange: '#ff6600',
          pumpkin: '#ea580c',
          purple: '#7928ca',
          violet: '#6d28d9',
          deep: '#0a0612',
          surface: '#130d22',
          surfaceHover: '#1c1432',
          border: '#332350',
          glow: '#ff6600',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Cinzel', 'Georgia', 'serif'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(217, 119, 6, 0.3)',
        'glow-rose': '0 0 20px rgba(225, 29, 72, 0.3)',
        'glow-halloween': '0 0 25px rgba(255, 102, 0, 0.35)',
        'glow-purple': '0 0 25px rgba(121, 40, 202, 0.35)',
        'inner-glow': 'inset 0 0 20px rgba(217, 119, 6, 0.1)',
      },
    },
  },
  plugins: [],
};