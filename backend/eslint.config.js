const js = require('@eslint/js');
const tsPlugin = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
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
