import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
})
