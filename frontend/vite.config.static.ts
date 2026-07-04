import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync } from 'fs';
import path from 'path';

// Static build config for GitHub Pages
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-sql-wasm',
      buildStart() {
        copyFileSync(
          'node_modules/sql.js/dist/sql-wasm.wasm',
          'public/sql-wasm.wasm',
        );
      },
    },
  ],
  resolve: {
    alias: {
      '#': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // For GitHub Pages with repo name: /repo-name/
  // Change this to your repo name or '/' if deploying to username.github.io
  base: '/',
});
