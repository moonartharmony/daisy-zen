/**
 * vite.capacitor.config.ts
 * Standalone SPA build for Capacitor (Android / iOS).
 * Outputs to dist/capacitor — used as Capacitor's webDir.
 *
 * Usage:  bun run build:cap
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'capacitor-app'),
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/capacitor'),
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: resolve(__dirname, 'capacitor-app/index.html'),
    },
  },
});
