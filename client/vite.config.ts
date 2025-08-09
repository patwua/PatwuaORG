import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build', // Render expects this by default
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
