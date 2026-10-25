import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
    },
  },
  prettierConfig,
  {
    rules: {
      curly: ['error', 'all'],
      'object-shorthand': 'error',
    },
  },
  {
    ignores: ['src/middlewares/tracking/**', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/server/posthog', '**/server/posthog'],
              message:
                'Capture analytics only in the tracking middleware, so every event goes through trackInput rules.',
            },
          ],
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.output/**',
      '.nitro/**',
      '.vinxi/**',
      'src/routeTree.gen.ts',
      'src/generated/**',
      'test/e2e/**',
      '*.cjs',
      'scripts/**',
    ],
  },
);
