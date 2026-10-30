/// <reference types="vitest/config" />
import compiler from '@motifx/compiler';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// Library build. The compiler lowers JSX to bindings before publishing, so consumers need no compiler setup.
export default defineConfig({
  plugins: [compiler()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    // Lets tests (and anything else inside the repo) import the package by its published name.
    alias: { '@motifx-community/i18n': fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    // A second @motifx/core would mean two reactivity engines.
    rollupOptions: { external: [/^@motifx\/core/] },
    sourcemap: true,
    minify: false,
    target: 'es2021',
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
