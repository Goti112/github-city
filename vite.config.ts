import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The lazily loaded 3D scene chunk (Three.js) is ~1 MB by nature; the initial bundle stays ~200 kB.
    chunkSizeWarningLimit: 1100,
  },
})
