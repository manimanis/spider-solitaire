import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Configuration Vite pour le Spider Solitaire
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  base: './'
})
