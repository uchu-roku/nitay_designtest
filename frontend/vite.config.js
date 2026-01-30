import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/nitay_designtest/',   // ← リポジトリ名
  server: {
    port: 3000
  }
})
