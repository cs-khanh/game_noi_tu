import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: https://username.github.io/demo_ci_cd/
  base: process.env.BASE_URL || '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.github.io',  // Allow GitHub Pages domains
      'noitu.khanhcs.id.vn',  // Custom domain
      '.khanhcs.id.vn'  // All subdomains
    ],
    watch: {
      usePolling: true
    }
  }
})

