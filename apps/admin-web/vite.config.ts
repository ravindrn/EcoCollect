import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  worker: {
    format: 'es', // MapLibre v6 requires ES module workers
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'], // Prevents Vite from pre-bundling MapLibre and breaking its worker paths
  },
})