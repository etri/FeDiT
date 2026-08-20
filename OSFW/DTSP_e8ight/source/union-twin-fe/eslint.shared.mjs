import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginImport from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintPluginTurbo from 'eslint-plugin-turbo';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Shared ESLint layers for the three workspaces. Each workspace has its own
// eslint.config that picks one of the exports at the bottom — the Next stack
// and the base stack cannot be merged into a single flat array, because the
// official Next configs register their own copies of the same plugins.

const sharedIgnores = globalIgnores([
  'dist/**',
  'build/**',
  '.next/**',
  '.turbo/**',
  'out/**',
  '**/*.timestamp-*.mjs',
]);

// ---------------------------------------------------------------- repo policy

const importPolicyPluginConfig = {
  name: 'workspace/repo-policy/import-plugin',
  files: ['**/*.{js,mjs,jsx,ts,tsx}'],
  settings: {
    // Keep import-plugin resolution simple and Node-like across the workspace.
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  plugins: {
    import: eslintPluginImport,
  },
};

const repoPolicyRulesConfig = {
  name: 'workspace/repo-policy',
  files: ['**/*.{js,mjs,jsx,ts,tsx}'],
  rules: {
    // Import ergonomics: keep blocks stable and readable without turning ESLint
    // into a formatter.
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'type',
          'unknown',
        ],
        pathGroups: [
          {
            pattern: 'react*',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-useless-path-segments': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',

    // A few high-signal runtime guardrails that teams commonly keep on.
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
  },
};

const typescriptRepoPolicyConfig = {
  name: 'workspace/repo-policy/typescript',
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
        caughtErrors: 'none',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};

const configFilesPolicyConfig = {
  name: 'workspace/repo-policy/config-files',
  files: [
    '**/*.config.{js,cjs,mjs,ts}',
    '**/*.config.*.{js,cjs,mjs,ts}',
    '**/*.cjs',
  ],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
};

const repoPolicyConfig = [
  importPolicyPluginConfig,
  repoPolicyRulesConfig,
  typescriptRepoPolicyConfig,
  configFilesPolicyConfig,
];

// The Next config already brings its own import-plugin stack, so it reuses the
// rules without re-registering the plugin.
const repoPolicyWithoutImportPluginConfig = [
  repoPolicyRulesConfig,
  typescriptRepoPolicyConfig,
  configFilesPolicyConfig,
];

// ----------------------------------------------------------------------- base

// Keep the shared base intentionally small.
// Framework rules and repo-specific policy layer on top.
const baseConfig = defineConfig([
  sharedIgnores,
  {
    // Common language options used across apps and internal packages.
    name: 'workspace/base-language',
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Start from the official recommended presets before layering anything custom.
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Turborepo's env-var linting catches cache-breaking env usage.
    ...eslintPluginTurbo.configs['flat/recommended'],
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
    rules: {
      'turbo/no-undeclared-env-vars': [
        'error',
        { allowList: ['^(DEV|PROD|MODE|SSR|BASE_URL)$'] },
      ],
    },
  },
  // Let Prettier own formatting decisions.
  eslintConfigPrettier,
]);

// ---------------------------------------------------------------------- react

const reactFiles = ['**/*.{jsx,tsx}'];

const reactConfig = [
  ...baseConfig,
  {
    // Browser globals only belong in React/browser projects, not the shared base.
    name: 'workspace/react-internal/globals',
    files: reactFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Use the plugin's recommended React rules instead of hand-maintaining them.
    ...reactPlugin.configs.flat.recommended,
    name: 'workspace/react-internal/recommended',
    files: reactFiles,
  },
  {
    ...reactPlugin.configs.flat['jsx-runtime'],
    name: 'workspace/react-internal/jsx-runtime',
    files: reactFiles,
  },
  {
    name: 'workspace/react-internal/hooks',
    files: reactFiles,
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // React 17+ and TypeScript make these rules noisy in practice.
    name: 'workspace/react-internal/overrides',
    files: reactFiles,
    rules: {
      'react/display-name': 'off',
      'react/prop-types': 'off',
    },
  },
  ...repoPolicyConfig,
];

// ----------------------------------------------------------------------- node

const nodeConfig = [
  ...baseConfig,
  {
    // Node/server projects: platform globals only, no browser or JSX layer.
    name: 'workspace/node/globals',
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  ...repoPolicyConfig,
];

// ----------------------------------------------------------------------- next

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});

const nextJsConfig = [
  globalIgnores(['dist/**', 'build/**', '.next/**', '.turbo/**', 'out/**']),
  {
    name: 'workspace/next/base-language',
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  js.configs.recommended,
  {
    ...eslintPluginTurbo.configs['flat/recommended'],
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
  },
  // Keep using the official Next configs here. `FlatCompat` has been the most
  // reliable way to consume them.
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...repoPolicyWithoutImportPluginConfig,
  eslintConfigPrettier,
];

export { nextJsConfig, nodeConfig, reactConfig };
