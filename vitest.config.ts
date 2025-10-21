import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['lib/indicators/**/*.ts'],
      exclude: ['**/*.test.ts', 'lib/indicators/index.ts'],
      thresholds: {
        lines: 0.8,
        statements: 0.8,
        functions: 0.8,
        branches: 0.7
      }
    }
  }
});
