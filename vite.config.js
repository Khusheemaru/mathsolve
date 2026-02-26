import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/supabase-proxy': {
        target: 'https://pmznhwsjajrvbxbslfgn.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, '')
      }
    }
  }
})
