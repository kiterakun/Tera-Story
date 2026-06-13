import type { Config } from 'tailwindcss'

/**
 * Tailwind config — extends Tailwind with the Tera-Story design tokens
 * defined in `frontend/src/index.css`.
 *
 * Every value here MUST reference a CSS variable so themes can swap
 * colors / motion timings without rebuilding.
 *
 * Spec: .kite-docs/spec/design-system-spec.md
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================================
      // Color palette
      // ============================================================
      colors: {
        // Theme-aware neutral surface
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
        // Warm/parchment palette for story prose
        parchment: {
          50:  'var(--parchment-50)',
          100: 'var(--parchment-100)',
          200: 'var(--parchment-200)',
          900: 'var(--parchment-900)',
        },
        // Primary interactive accent
        accent: {
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
        },
        // NEW — gold palette (was broken: bg-gold used but undefined)
        gold: {
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: 'var(--gold-600)',
        },
        // Semantic rarity — invariant across themes
        rarity: {
          common:    'var(--rarity-common)',
          uncommon:  'var(--rarity-uncommon)',
          rare:      'var(--rarity-rare)',
          epic:      'var(--rarity-epic)',
          legendary: 'var(--rarity-legendary)',
        },
        // Semantic status — invariant across themes
        status: {
          active:  'var(--status-active)',
          injured: 'var(--status-injured)',
          missing: 'var(--status-missing)',
          dead:    'var(--status-dead)',
        },
        // Semantic roles
        danger:  'var(--danger)',
        success: 'var(--success)',
        info:    'var(--info)',
        warning: 'var(--warning)',
        // Scrim — modal/drawer overlay. Replaces bg-black/{50,60,70}.
        scrim: 'var(--scrim)',
      },

      // ============================================================
      // Typography
      // ============================================================
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['Lora', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      maxWidth: {
        story:    '65ch',
        'story-lg': '75ch',
      },
      lineHeight: {
        story: '1.7',
      },

      // ============================================================
      // Spacing — semantic aliases (used via p-card, px-page-x, etc.)
      // ============================================================
      spacing: {
        card:      'var(--space-card)',        // 1rem
        'card-lg': 'var(--space-card-lg)',     // 1.5rem
        section:   'var(--space-section)',     // 3rem
        'page-x':  'var(--space-page-x)',      // 1rem
        'page-x-lg': 'var(--space-page-x-lg)', // 1.5rem
      },

      // ============================================================
      // Border radius — token-mapped
      // ============================================================
      borderRadius: {
        sm:   'var(--radius-sm)',   // 0.375rem
        md:   'var(--radius-md)',   // 0.5rem
        lg:   'var(--radius-lg)',   // 0.75rem
        xl:   'var(--radius-xl)',   // 1rem
        '2xl': 'var(--radius-2xl)', // 1.5rem
        full: 'var(--radius-full)', // 9999px
      },

      // ============================================================
      // Shadows — token-mapped (includes glow variants)
      // ============================================================
      boxShadow: {
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        xl:   'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        gold: 'var(--shadow-gold)',
      },

      // ============================================================
      // Motion — keyframes + named animations (token-mapped durations)
      // ============================================================
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fly-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--accent-500)' },
          '50%':      { boxShadow: '0 0 16px 4px var(--accent-500)' },
        },
      },
      animation: {
        'fade-in':        'fade-in var(--duration-base) var(--ease-decelerate)',
        'fade-out':       'fade-out var(--duration-base) var(--ease-accelerate)',
        'scale-in':       'scale-in var(--duration-slow) var(--ease-spring)',
        'slide-in-right': 'slide-in-right var(--duration-slow) var(--ease-standard)',
        'fly-up':         'fly-up 1500ms var(--ease-standard)',
        'pulse-glow':     'pulse-glow 2000ms var(--ease-standard) infinite',
      },

      // ============================================================
      // Transition duration — token-mapped
      // ============================================================
      transitionDuration: {
        fast:   'var(--duration-fast)',   // 120ms
        base:   'var(--duration-base)',   // 200ms
        slow:   'var(--duration-slow)',   // 320ms
        slower: 'var(--duration-slower)', // 500ms
      },

      // ============================================================
      // Transition timing function — token-mapped
      // ============================================================
      transitionTimingFunction: {
        linear:     'var(--ease-linear)',
        standard:   'var(--ease-standard)',
        decelerate: 'var(--ease-decelerate)',
        accelerate: 'var(--ease-accelerate)',
        spring:     'var(--ease-spring)',
      },
    },
  },
  plugins: [],
} satisfies Config
