import { nextJsConfig } from '../eslint.shared.mjs';

export default [
  ...nextJsConfig,
  {
    ignores: ['next-env.d.ts'],
  },
];
