// Shared flat ESLint config. Each workspace's own eslint.config.mjs spreads
// this array and appends package-specific overrides (e.g. Next.js rules).
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier,
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**', 'generated/**'],
  },
];

export default baseConfig;
