/**
 * Configuração do Vitest com suporte a testes e coverage
 */
module.exports = {
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
    exclude: ['backend/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'text-summary'],
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/',
        'backend/**',
        'test/**',
        'dist/**',
        'assets/**',
        '**/*.config.*',
        'coverage/**',
        'src/main.js',
      ],
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70,
      all: true,
    },
  },
};
