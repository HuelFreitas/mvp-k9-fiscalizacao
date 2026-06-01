module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  ignorePatterns: ['coverage/', 'dist/', 'node_modules/'],
  overrides: [
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        browser: false
      }
    },
    {
      files: ['test/**/*.js'],
      env: {
        node: true,
        browser: true
      }
    }
  ],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
