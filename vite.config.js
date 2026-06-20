import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Netlify/local serve from root; GitHub Pages needs /application-tracker/
// (set via VITE_BASE env var in the Actions workflow).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'discovery/**/*.test.js'],
  },
})
