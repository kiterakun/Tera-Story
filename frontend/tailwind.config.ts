import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode palette
        ink: {
          950: '#0F172A',  // main bg
          800: '#1E293B',  // card bg
          700: '#334155',  // muted/borders
          200: '#E2E8F0',  // main text
          100: '#F1F5F9',  // bright text
        },
        // Light mode palette
        parchment: {
          50:  '#FDFBF7',  // main bg
          100: '#F5F0E8',  // card bg
          200: '#E8E0D0',  // borders
          900: '#1A202C',  // main text
        },
        // Accent colors
        accent: {
          400: '#818CF8',  // dark mode accent (Indigo 400)
          600: '#4F46E5',  // light mode accent (Indigo 600)
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
    },
  },
  plugins: [],
} satisfies Config