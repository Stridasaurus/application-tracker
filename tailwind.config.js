/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Track accent colors used across board + analytics.
        track: {
          quant: '#6366f1',
          neuro: '#ec4899',
          defense: '#0ea5e9',
          fusion: '#f59e0b',
          phd: '#10b981',
          other: '#64748b',
        },
      },
    },
  },
  plugins: [],
}
