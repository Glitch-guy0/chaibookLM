import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['backend/**/*.test.ts', 'components/**/*.test.ts'],
    exclude: ['**/node_modules/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@backend': path.resolve(__dirname, 'backend/src'),
      '@components': path.resolve(__dirname, 'components'),
    },
  },
});
