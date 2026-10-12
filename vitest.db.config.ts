import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/db/**/*.test.ts'],
    exclude: [
      'node_modules',
      'reference',
      'data',
      '.next',
      'dist',
      'tests/e2e/**',
      'tests/unit/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
