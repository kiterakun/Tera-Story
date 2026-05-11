const js = require('@eslint/js');
const tsPlugin = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js', 'vitest.config.ts'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
