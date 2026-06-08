import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true
      },
      '/packages': {
        target: 'http://localhost:3005',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
    sourcemap: false
  }
});
