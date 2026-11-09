import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 2400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('node_modules') && id.includes('three')) return 'three';
        },
      },
    },
  },
});
