import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      manifest: false,
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        'manifest.json',
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-180.png',
        'README_OFFLINE_USAGE.txt',
      ],
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        sourcemap: false,
      },
    }),
  ],
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
