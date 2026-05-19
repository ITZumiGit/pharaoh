import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/pharaoh/',
  server: {
    port: 3000,
    host: true
  }
})