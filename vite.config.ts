import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    dedupe: ['comlink']
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['comlink'],
    exclude: []
  },
  build: {
    target: 'es2022',
    sourcemap: true
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});
