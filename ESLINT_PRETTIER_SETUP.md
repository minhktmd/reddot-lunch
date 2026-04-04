# ESLint + Prettier Setup

> **Instructions for Claude Code.** Follow each step in order. Do not skip any step.

---

## Step 1 — Install packages

```bash
pnpm add -D \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-plugin-import \
  eslint-plugin-unused-imports \
  eslint-plugin-unicorn
```

**Do NOT install the following — already bundled inside `eslint-config-next`:**

- `eslint`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`

---

## Step 2 — Create `.prettierrc`

Create `.prettierrc` at the project root:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 120,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Step 3 — Create `.prettierignore`

Create `.prettierignore` at the project root:

```
.next
node_modules
public
dist
*.min.js
pnpm-lock.yaml
```

---

## Step 4 — Create `eslint.config.mjs`

> **Important:** If the project already has an `.eslintrc.*` file, delete it first — only `eslint.config.mjs` should exist. Next.js 16 uses native ESLint Flat Config — `FlatCompat` is no longer needed.

Create `eslint.config.mjs` at the project root:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';

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
```

---

## Step 5 — Update `package.json`

Ensure the following scripts exist in `package.json`. Add any that are missing — do not remove existing scripts:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

> **Next.js 16:** `next lint` has been removed. ESLint must be called directly.

---

## Step 6 — Create `.vscode/settings.json`

Create the `.vscode/` directory if it does not exist, then create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.useFlatConfig": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "'([^']*)'"]]
}
```

> `tailwindCSS.experimental.classRegex` enables Tailwind IntelliSense inside the `cn()` utility from `shared/lib/cn`.

---

## Step 7 — Verify

Run the following commands and confirm there are no setup errors:

```bash
# Check Prettier is working
pnpm format:check

# Check ESLint is working
pnpm lint

# Auto-fix lint issues where possible
pnpm lint:fix

# Format the entire codebase for the first time
pnpm format
```

Also check that `next.config.ts` does **not** contain an `eslint` option — it has been removed in Next.js 16 and will cause a build error if present:

```ts
// ❌ Remove this if present
const nextConfig = {
  eslint: { ... },
};
```

---

## Notes

### Why `import/no-cycle` instead of enforcing "import via index.ts only"

`import/no-cycle` catches circular dependencies between features, which is the most common symptom of cross-feature import violations. The rule "only import via `index.ts`" cannot be fully enforced by ESLint without a custom plugin — it still requires code review and the constraints in CLAUDE.md.

### `unicorn/filename-case` and shadcn/ui

shadcn/ui generates files in PascalCase by default (e.g. `Button.tsx`). Per CLAUDE.md, this project uses kebab-case for all files. After running `pnpm dlx shadcn@latest add <component>`, rename the generated file to kebab-case immediately.

### `react/function-component-definition`

This rule only enforces function declarations for named components. Arrow functions remain valid for callbacks, handlers, and unnamed components — consistent with the convention in CLAUDE.md.
