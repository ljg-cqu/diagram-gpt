import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    passWithNoTests: false,
  },
});

// Coverage thresholds
export const coverage = {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  statements: 80,
  branches: 70,
  functions: 80,
  lines: 80,
};
