import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig([
  // ── Base: Next.js (bundles react, react-hooks, jsx-a11y, @typescript-eslint, @next/next) ──
  ...nextVitals,
  ...nextTypescript,

  // ── Global settings ──
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  // ── Main rules ──
  {
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
      unicorn,
    },

    rules: {
      // ── TypeScript ──
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off', // delegated to unused-imports plugin
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': 'error',

      // ── Unused imports (auto-fixable) ──
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // ── Import order: external → @/ (internal) → relative → type ──
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-cycle': ['error', { maxDepth: 3 }],
      'import/no-self-import': 'error',

      // ── React ──
      'react/function-component-definition': [
        'warn',
        {
          namedComponents: 'function-declaration', // export function Foo() — per CLAUDE.md
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/no-array-index-key': 'warn',
      'react/display-name': 'off', // false positives with Next.js RSC

      // ── React Hooks ──
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── General JS ──
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // ── Unicorn (selective — not using recommended preset) ──
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: [/^[A-Z][A-Z_]+\.md$/], // CLAUDE.md, SPEC.md, README.md, etc.
        },
      ],
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-useless-undefined': 'warn',
    },
  },

  // ── Relax rules for config files at root ──
  {
    files: ['*.config.{js,mjs,ts}', 'src/config/**/*.ts'],
    rules: {
      'import/no-cycle': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ── Ignore generated / vendored files ──
  globalIgnores(['.next/**', 'node_modules/**', 'public/**', 'dist/**']),
]);
