const globals = require('globals');
const eslintRecommended = require('@eslint/js');
const pluginPrettier = require('eslint-plugin-prettier');

module.exports = [
  eslintRecommended.configs.recommended,
  {
    plugins: { prettier: pluginPrettier },
    rules: { ...pluginPrettier.configs.recommended.rules },
  },
  {
    ignores: ['node_modules/**', 'scripts/**', '.husky/**', '.github/**', 'public/**'],
  },
  // Backend server (Node.js)
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      'no-debugger': 'warn',
    },
  },
  // Browser (V8)
  {
    files: ['src/frontend/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, io: 'readonly' },
      sourceType: 'module',
    },
    rules: {
      'no-debugger': 'warn',
    },
  },
];
