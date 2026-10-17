import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: '../backend/priv/static',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'src/app.js'),
      output: {
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
