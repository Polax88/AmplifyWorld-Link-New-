import { baseConfig } from '@amplifyworld/config/eslint';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...baseConfig,
  ...compat.extends('next/core-web-vitals'),
  { ignores: ['.next/**', 'next-env.d.ts'] },
];

export default config;
