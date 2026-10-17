import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { include: ['src/**/*.test.ts'] },
  server: {
    strictPort: true,
    proxy: {
      '/ws': { target: 'ws://127.0.0.1:4000', ws: true },
      '/health': 'http://127.0.0.1:4000',
    },
  },
})
