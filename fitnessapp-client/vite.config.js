import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: false,
    proxy: {
      '/api': {
        target: 'https://localhost:7240',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})