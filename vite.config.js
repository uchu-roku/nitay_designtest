import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/nitay_designtest/',
  server: {
    port: 3000
  },
  publicDir: 'frontend/public',
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src')
    }
  }
})
