import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    watch: {
      ignored: [
        '**/English Master 50/**',
        '**/GK Full Course 26/**',
        '**/Medilogy English & GK/**',
        '**/RTDS Questions/**',
        '**/SureShot SecondTimer Carnival/**',
        '**/public/exams_data/**',
        '**/exams_data/**',
      ],
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        }
      }
    }
  }
})
