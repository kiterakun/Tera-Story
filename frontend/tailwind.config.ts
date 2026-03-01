import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware colors via CSS variables (swap in index.css)
        ink: {
          950: 'var(--ink-950)',
          900: 'var(--ink-900)',
          800: 'var(--ink-800)',
          700: 'var(--ink-700)',
          600: 'var(--ink-600)',
          500: 'var(--ink-500)',
          200: 'var(--ink-200)',
          100: 'var(--ink-100)',
        },
        parchment: {
          50:  'var(--parchment-50)',
          100: 'var(--parchment-100)',
          200: 'var(--parchment-200)',
          900: 'var(--parchment-900)',
        },
        accent: {
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],           // story body
        sans: ['Inter', 'system-ui', 'sans-serif'],    // UI elements
        display: ['Playfair Display', 'Georgia', 'serif'], // headings
      },
      maxWidth: {
        'story': '65ch',
        'story-lg': '75ch',
      },
      lineHeight: {
        'story': '1.7',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
