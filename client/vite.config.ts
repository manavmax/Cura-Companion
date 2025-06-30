// Project scaffolded and started in Bolt.new for the Bolt.new Hackathon
// See: https://bolt.new/
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://cura-companion.onrender.com',
        changeOrigin: true,
      },
      '/logs': {
        target: 'https://cura-companion.onrender.com',
        changeOrigin: true,
      }
    },
    allowedHosts: [
      'localhost',
    ],
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/public/**', '**/log/**']
    }
  },
})
