import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['plotly.js'],
  },
  resolve: {
    alias: {
      'buffer/': 'buffer',
    },
  },
  server: {
    port: 5173,
  },
})
