import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: [
      'node_modules',
      'reference',
      'data',
      '.next',
      'dist',
      'tests/e2e/**',
      'tests/db/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
