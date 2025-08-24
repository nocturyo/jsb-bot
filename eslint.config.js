/* eslint-disable @typescript-eslint/no-require-imports */

// eslint.config.js (CommonJS)
const tseslint = require('typescript-eslint');
const configPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  // ignorowane katalogi
  { ignores: ['dist/**', 'node_modules/**'] },

  // rekomendowane reguły TS
  ...tseslint.configs.recommended,

  // nasze ustawienia
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // własne reguły (opcjonalnie)
    },
  },

  // wyłącza reguły kolidujące z Prettierem
  configPrettier,
);
