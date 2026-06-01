import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'text-summary'],
    include: ['src/**/*.js'],
    exclude: ['src/index.js', 'src/routes/**/*.js'],
    lines: 70,
    statements: 70,
    functions: 70,
    all: true,
  },
});
