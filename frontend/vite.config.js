import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'noitu.khanhcs.id.vn',
      'localhost',
      '.khanhcs.id.vn'  // Allow all subdomains
    ],
    watch: {
      usePolling: true
    }
  }
})

