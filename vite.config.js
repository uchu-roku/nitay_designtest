import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/nitay_designtest/',
  server: {
    port: 3000,
    allowedHosts: ['sb-45dr4mo4rsgw.vercel.run']
  },
  root: 'frontend',
  build: {
    outDir: '../dist'
  }
})
