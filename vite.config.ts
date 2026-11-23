import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 8080, open: true },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
