import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin.js'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './data/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'main-color': 'var(--main-color)',
        'main-highlight': 'var(--main-highlight)',
        'header-text': 'var(--header-text)',
        'theme-header-text': 'var(--header-text)',
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          'PingFang',
          'Manrope',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // `:not(#_):not(#_)` boosts specificity to (2,2,1) so `light:*` utilities on a template
      // always beat scoped component CSS and the global light-mode.css overrides (1,2,1).
      addVariant('light', [
        'html[data-theme="light"]:not(#_):not(#_) &',
        '.light:not(#_):not(#_) &',
        '&[data-theme="light"]',
        '&.light',
      ])
    }),
  ],
} satisfies Config
