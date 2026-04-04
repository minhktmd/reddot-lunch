# CLAUDE.md

<!-- =========================================================
  TEMPLATE NOTES — delete this entire block before using
  - Replace all [placeholders] with actual project content
  - Keep this file concise — Claude Code reads it FIRST every session
  - Purpose: fast orientation, not exhaustive documentation
  - Technical details → docs/ARCHITECTURE.md
  - Business details → docs/OVERVIEW.md + domain docs + feature SPECs
========================================================= -->

---

## Project

**[Project Name]** — [1-2 sentence description: what it does, who it's for, what platform]

<!-- Example:
  **Zofi** — A GameFi DApp combining farming mechanics with a decentralized investment fund,
  running on HyperEVM, targeting mainstream DeFi users.
-->

---

## Tech Stack

<!-- List technologies concisely by concern. No rationale here — put that in docs/ARCHITECTURE.md. -->

| Concern       | Technology                                      |
| ------------- | ----------------------------------------------- |
| Framework     | [Next.js 15 / App Router]                       |
| Language      | [TypeScript 5.x]                                |
| Styling       | [Tailwind CSS v4]                               |
| UI Components | [shadcn/ui]                                     |
| Server State  | [TanStack Query v5]                             |
| Client State  | [Zustand]                                       |
| Validation    | [Zod]                                           |
| Forms         | [React Hook Form]                               |
| Auth          | [NextAuth / ...]                                |
| Notifications | [Sonner]                                        |
| HTTP Client   | [shared/services/api.ts — custom fetch wrapper] |

---

## Commands

<!-- List the scripts Claude Code needs to verify a build after implementing. -->

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm type-check   # TypeScript check (no emit)
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
# pnpm test       # [if applicable]
# pnpm e2e        # [if applicable — Playwright/Cypress]
```

---

## Documentation Hierarchy

<!-- This is the reading order Claude Code should follow for any task — big picture to detail. -->

Read in this order for full context:

1. **`docs/BRIEF.md`** — Raw requirements from owner (unedited, natural language)
2. **`docs/OVERVIEW.md`** — Structured product overview: domain model, feature map, user roles
3. **`docs/domains/<domain>.md`** — Shared domain knowledge (read the domain relevant to your task)
4. **`src/features/<feature>/SPEC.md`** — Feature-specific detail: screens, API contracts, business rules

<!-- Add or remove lines as domains are added to the project. Example:
  3a. `docs/domains/finance.md`   — Finance domain: wallet, transaction, balance
  3b. `docs/domains/identity.md`  — Identity domain: user profile, KYC
-->

---

## Folder Structure

### App

```
src/
├── app/                        → Routing only. Thin pages composing from features.
│   ├── layout.tsx              → Root layout + providers
│   ├── page.tsx                → Home / redirect
│   └── (route-group)/          → Route groups (e.g. (auth)/, (dashboard)/)
│
├── features/                   → See "Feature Structure" below
├── domains/                    → See "Domain Structure" below
│
├── shared/
│   ├── components/             → Atomic Design (shared UI only)
│   │   ├── atoms/              → Button, Input, Badge, Icon, Spinner...
│   │   ├── molecules/          → FormField, SearchBar, NavItem, StatCard...
│   │   ├── organisms/          → Header, Sidebar, DataTable, Modal...
│   │   └── templates/          → AppShell, AuthLayout, DashboardLayout...
│   ├── constants/              → App-wide constants (error codes, regex, config keys...)
│   ├── hooks/                  → Cross-feature hooks (useDebounce, useMediaQuery...)
│   ├── lib/                    → Wrappers around external packages (api-client, cn, logger...)
│   ├── services/               → Base HTTP service (api.ts)
│   ├── stores/                 → Global Zustand stores (if any)
│   ├── utils/                  → Pure functions, no external package imports (format, parse, transform...)
│   ├── types/                  → common.types.ts (shared across all)
│   └── providers/              → Global contexts (1 file per context, composed in index.tsx)
│       ├── auth-provider.tsx   → createContext + Provider + custom hook all in one file
│       ├── theme-provider.tsx
│       ├── query-provider.tsx
│       └── index.tsx           → Composes all providers, imported by app/layout.tsx
│
└── config/
    ├── env.ts                  → Typed env variables (validated at startup)
    ├── routes.ts               → Centralized route constants
    └── site.ts                 → Site metadata (name, description, urls)
```

### Feature Structure

Each feature in `src/features/<feature>/` follows this layout:

```
<feature>/
├── SPEC.md                     ★ Read this before implementing
├── components/                 → Feature components (flat — no atomic subdivision)
├── hooks/
├── services/                   → All API/async functions for this feature
├── stores/
├── types/
├── constants/                  [OPTIONAL] Feature-specific constants
├── lib/                        → Feature-specific helpers, may import external packages
├── <feature>-context.tsx       [OPTIONAL] Only create when this feature needs React Context
└── index.ts                    ★ Public API — only import from here
```

### Domain Structure

Each domain in `src/domains/<domain>/` follows this layout:

```
<domain>/
├── components/                 → Shared UI tied to this domain's data
├── hooks/
├── services/                   → Shared API functions across features in this domain
├── stores/
├── types/
├── constants/                  [OPTIONAL] Domain-wide constants (status enums, business limits...)
├── lib/
└── index.ts                    ★ Public API — only import from here
```

---

## Dependency Rules

```
app/ → features/ → domains/ → shared/
```

- `app/` only imports from `features/` via `index.ts`
- `features/` imports from `domains/` and `shared/` via `index.ts`
- Features **NEVER** import internals from another feature
- `domains/` only imports from `shared/`
- `shared/` imports from nothing (leaf layer)

---

## Do NOT

<!-- Common violations — Claude Code should re-read this section before committing.
     If violations occur, prompt: "Re-read CLAUDE.md Do NOT section. Fix violations." -->

**Architecture:**

- ❌ Import internals from another feature — use `index.ts` only
- ❌ Put business logic in `src/app/` pages
- ❌ Let features import from each other outside of `index.ts`
- ❌ Duplicate domain types or logic inside individual features
<!-- barrel exports at shared/ root cause circular dependency issues in bundlers -->
- ❌ Create barrel exports at the `shared/` root

**Components:**

- ❌ Apply Atomic Design inside `features/` or `domains/` (flat components only)
- ❌ Let atoms import molecules, or molecules import organisms (respect atomic hierarchy)
- ❌ Put business logic inside shared components
- ❌ Create a new shared component for something used in only one feature
- ❌ Prop drilling beyond 2 levels — lift state to context or a state manager
- ❌ Direct DOM manipulation (`document.querySelector`...) — use `ref` instead

**TypeScript:**

- ❌ Use `any` — use `unknown` + type guards
- ❌ Use `Promise<any>` as a service return type — use `Promise<void>` or a typed interface
- ❌ Use TypeScript `enum` — use `as const` + derived type + options array instead (use skill `const-map-pattern`)
- ❌ Use type assertion (`as SomeType`) to silence TypeScript — fix the type instead; only acceptable when narrowing from `unknown` after validation
- ❌ Access `process.env` directly — use `config/env.ts`
- ❌ Ignore error types from API responses

**Services & Data:**

- ❌ Use `fetch` or `axios` directly — always use the base service from `shared/services/api.ts`
- ❌ Write inline query key arrays — always use the factory in `shared/constants/query-keys.ts`
- ❌ Skip Zod validation on API responses — always use `.safeParse()` and check `result.success` before using `result.data`

**Patterns:**

- ❌ Fetch data directly inside components — use hooks or TanStack Query
- ❌ Add files to `shared/` for logic that is only used by one feature
- ❌ Edit files outside the scope of the current SPEC.md (unless there is a clear reason)
- ❌ Leave `console.log` in committed code — use the logger or remove debug statements
- ❌ Silently swallow errors in `catch` blocks — always at minimum `logger.error` them

---

## How to Implement a Feature

<!-- Keep this workflow intact — only update if the actual process changes. -->

1. Read `docs/BRIEF.md` if you need to understand the original business intent
2. Read `docs/OVERVIEW.md` for domain model and feature map
3. Read `docs/domains/<relevant>.md` for shared domain knowledge
4. Check `src/domains/<relevant>/index.ts` — reuse before writing new code
5. Read `src/features/<feature>/SPEC.md` — this is the source of truth for the feature
6. Implement in order: **types → services → stores → hooks → components → index.ts**
7. Wire up the route at `src/app/<route>/page.tsx` (thin wrapper, no business logic)
8. Verify each User Story in SPEC.md — update `[ ]` → `[x]` when done

---

## Key Conventions

<!-- List the highest-impact conventions — the ones Claude Code most often gets wrong.
     Full details → docs/ARCHITECTURE.md. No need to be exhaustive here. -->

### Code Style & Naming

- **Prettier:** semicolons, single quotes, 2-space indent, 120 print width, `es5` trailing commas
<!-- function declarations over arrow functions: enables hoisting (helpers can be defined after component), produces clearer TypeScript error messages -->
- **Components:** function declarations (`export function Foo()`)
- **Callbacks & handlers:** arrow functions (`const handleClick = () => {}`)
- **`"use client"`:** required at the top of any file using hooks, events, or browser APIs
- **Exports:** named exports everywhere — default exports only for Next.js file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`)
- **Barrel files:** re-export via `index.ts` using named exports only
- **Path alias:** `@/*` → `src/*` — never use relative paths across feature boundaries
- **Import order:** external packages → internal `@/` → relative → type imports
- **Boolean props:** prefer `<Component disabled />` over `<Component disabled={true} />`
- **No magic numbers:** extract to named constants in `shared/constants/` or feature `constants/`
- **No inline styles:** Tailwind classes only — no `style={{}}` unless absolutely unavoidable
- **No unused imports:** enforced by ESLint
- **Types:** use `unknown` + type guards instead of `any`; prefer `type` over `interface` — use `interface` only when declaration merging is explicitly needed (e.g. augmenting third-party library types)
- **Env vars:** always via `config/env.ts` — never `process.env` directly
- **Export types** from a feature via `index.ts` alongside components

**Naming conventions:**

| Type              | Convention                         | Example                                          |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| Files & folders   | kebab-case                         | `login-form.tsx`, `use-auth.ts`                  |
| Components        | kebab-case file, PascalCase export | `login-form.tsx` → `export function LoginForm()` |
| Hooks             | camelCase, `use` prefix            | `export function useAuth()`                      |
| Types/Interfaces  | PascalCase                         | `AuthResponse`, `LoginPayload`                   |
| Zustand stores    | camelCase, `use` prefix            | `export const useAuthStore = create(...)`        |
| Service functions | camelCase, verb-first              | `getVaults()`, `createVault()`                   |
| Zod schemas       | camelCase, `Schema` suffix         | `loginPayloadSchema`                             |

**File naming by folder:**

| Folder                  | Pattern                      | Example                                    |
| ----------------------- | ---------------------------- | ------------------------------------------ |
| `services/`             | `[resource].service.ts`      | `vault.service.ts`, `user.service.ts`      |
| `types/`                | `[resource].type.ts`         | `vault.type.ts`, `user.type.ts`            |
| `hooks/`                | `use-[action]-[resource].ts` | `use-get-vaults.ts`, `use-create-vault.ts` |
| `components/`           | `[feature]-[role].tsx`       | `vault-card.tsx`, `user-table.tsx`         |
| `stores/`               | `[resource].store.ts`        | `vault.store.ts`, `user.store.ts`          |
| `<feature>-context.tsx` | `[resource]-context.tsx`     | `vault-context.tsx`, `auth-context.tsx`    |

**Schemas vs Types:**

- `types/` owns interfaces and types **not** derived from Zod (API response shapes, prop types, union types)
- Zod schemas: define in `types/[resource].type.ts`, co-located with the derived `z.infer` type
- If a feature has 3+ schemas: extract to a dedicated `schemas/` folder with `[resource].schema.ts` naming
<!-- manually redefining a type that already exists as z.infer creates two sources of truth that will inevitably drift -->
- Never duplicate — if a type is derived from Zod, use `z.infer<typeof schema>` only, do not redefine manually
- Same conventions apply inside `shared/` and `domains/`

<!-- TypeScript rules merged into Code Style -->

### Components

- Component > 200 lines → extract sub-components
- Generic UI with no business logic → `shared/components/`
- UI tied to domain data, used by 2+ features → `domains/<domain>/components/`
- UI used only within one feature → `features/<feature>/components/`
- Atomic Design applies only inside `shared/components/` — features use flat `components/`

**Atomic Design reference:**

```
shared/components/
├── atoms/      Smallest unit, wraps 1 HTML element (Button, Input, Badge, Icon, Spinner, Avatar)
├── molecules/  Groups of atoms (FormField, SearchBar, NavItem, StatCard, DropdownMenu, Toast)
├── organisms/  Complex sections (Header, Sidebar, DataTable, Modal, Form)
└── templates/  Page-level layouts — slots for content, no business data
                (AppShell, AuthLayout, DashboardLayout)
```

Dependency direction: `templates → organisms → molecules → atoms` (never reverse)

### Component Rules

- Prefer `useReducer` over multiple `useState` when: 3+ interdependent state fields, or next state depends on previous state
- No logic in JSX — extract conditions and transforms to variables before `return`
- Avoid `useEffect` for derived state — compute directly from existing state or props
- Key props on lists must be stable unique IDs — never use array index as key
- Extract repeated JSX structures (> 5 lines, used 2+ times) into named components
- Always pass `aria-label` to icon-only buttons and interactive elements without visible text
- Use `cn()` from `@/shared/lib/cn` to merge Tailwind classes — never string concatenation

**Context pattern** — always co-locate context object, provider, and consumer hook in one file:

- Always initialize context with `null`, never with `{} as T` or a fake default value
- Always throw a descriptive error in the consumer hook when context is `null`
- Never call `useContext` directly outside of the dedicated consumer hook

→ Use skill `context-pattern` for full boilerplate

### State Management

- Server state (from API) → TanStack Query
- Client state (UI state) → Zustand or `useState`
- Form state → React Hook Form + Zod resolver

**Zustand store rules:**

- Always named export (`export const use...`) — no default exports
<!-- extracting initialState ensures reset() always returns to the exact same state without duplicating values -->
- Extract `initialState` as a const — makes `reset()` reliable and DRY
<!-- persist adds localStorage coupling and rehydration complexity — most UI state does not need to survive refresh -->
- Add `persist` middleware only when state must survive page refresh — never by default
- Keep stores flat — avoid deeply nested state shapes
- Actions (`set`) live inside the store — never mutate state from outside

→ Use skill `zustand-pattern` for full boilerplate

### API & Data Fetching

- **Client-side requests:** Axios instance (`apiClient`) from `shared/services/api.ts` — interceptors inject auth token, normalize errors, and unwrap `res.data` globally
- **Server-side requests (Next.js only):** native `fetch` — preserves Next.js cache extensions (`cache`, `next.revalidate`)
<!-- safeParse returns {success, data, error} instead of throwing — validation errors are handled explicitly at the service level, not accidentally swallowed by a caller's catch block -->
- **Feature services:** `features/<feature>/services/` — always validate responses with Zod `safeParse()` (Zod v3+), never `.parse()`
- **Domain services:** `domains/<domain>/services/` — shared API functions reused across multiple features
- **Queries:** wrap `useQuery` with the project's auth-aware query hook — only enable queries when auth is ready
- **Mutations:** call `queryClient.invalidateQueries({ queryKey: queryKeys.x.all })` after every mutation
- **Query keys:** use the centralized factory in `shared/constants/query-keys.ts` — never write inline string arrays
- **204 No Content:** handle per-service — do not rely on unwrapped `res.data` for empty responses

→ Use skill `service-pattern` for Axios instance boilerplate, safeParse pattern, query key factory, and mutation boilerplate

### Form Handling

- Stack: `react-hook-form` v7 + `zod` v4 + `@hookform/resolvers` v5
<!-- @hookform/resolvers <v5 + Zod v4: resolver throws instead of returning field errors, making form.formState.errors always empty -->
- **Note:** `@hookform/resolvers` < v5 is incompatible with Zod v4
- Always define Zod schema first → derive type with `z.infer<typeof schema>` → pass `zodResolver(schema)` to `useForm`
- **Field errors:** rendered inline below each field via `formState.errors`
- **Submit errors:** (e.g. API error after submit) displayed via toast, not injected into form state

```ts
const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;
const form = useForm<FormValues>({ resolver: zodResolver(schema) });
```

### Error Handling & Logging

- API errors → typed error response, displayed via Sonner toast
- Unexpected errors → error boundary component or fallback UI
- In `catch` blocks: always use `logger.error` — never silently swallow errors

**Logger** (`shared/lib/logger.ts`):

- `logger.log` — debug only, hidden in production
- `logger.warn` — always visible
- `logger.error` — always visible

If `logger.ts` does not exist yet: fall back to `console.warn` / `console.error` — never commit bare `console.log`.

<!-- Add project-specific conventions below. Examples:
     Web3/wallet patterns, i18n conventions, animation rules... -->

---

## Commit Convention

Format: `<type>(<scope>): <description>`

| Type       | When to use                                  |
| ---------- | -------------------------------------------- |
| `feat`     | New feature                                  |
| `fix`      | Bug fix                                      |
| `refactor` | Code change that is not a feature or bug fix |
| `chore`    | Maintenance — deps, config, tooling          |
| `docs`     | Documentation only                           |
| `style`    | Formatting, no logic change                  |
| `test`     | Adding or updating tests                     |
| `perf`     | Performance improvement                      |

**Rules:**

- `scope`: optional, kebab-case feature or module name (`auth`, `deposit`, `farm`)
- `description`: imperative mood, lowercase, no trailing period ("add" not "added")
- Breaking change: append `!` after type — `feat!: migrate to new auth flow`

```bash
feat(auth): add Privy wallet connection
fix(deposit): handle insufficient balance error
refactor(farm): extract season calculation to service
chore: update shadcn/ui to v2.1
```

---

## Feature Map (Quick Reference)

<!-- Full overview → docs/OVERVIEW.md. Update this table whenever a feature is added. -->

| #   | Feature     | Route      | Domain   | Status      |
| --- | ----------- | ---------- | -------- | ----------- |
| 1   | [Feature A] | `/route-a` | [domain] | Planned     |
| 2   | [Feature B] | `/route-b` | [domain] | In Progress |
| 3   | [Feature C] | `/route-c` | —        | Done        |

---

## Skills

Skills are best-practice playbooks Claude Code loads on demand — not read every session.

### Project skills (available in `.claude/skills/`)

| Skill               | Use when                                             |
| ------------------- | ---------------------------------------------------- |
| `const-map-pattern` | Creating a const map, derived type, or options array |
| `context-pattern`   | Creating a new React Context                         |
| `service-pattern`   | Creating a service function, query hook, or mutation |
| `zustand-pattern`   | Creating a Zustand store                             |
| `form-pattern`      | Creating a form with React Hook Form + Zod           |
| `error-handling`    | Implementing error boundary, toast, or logger        |

<!-- form-pattern and error-handling skills are pending creation — see docs/SKILLS.md -->

### Community skills

<!-- Installation instructions → docs/SKILLS.md -->

| Skill                         | Use when                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `vercel-react-best-practices` | Writing components, data fetching, optimization                                      |
| `vercel-composition-patterns` | Designing shared components                                                          |
| `next-best-practices`         | Next.js file conventions, RSC boundaries, async APIs, metadata, image/font, bundling |

### Note on barrel imports

`vercel-react-best-practices` includes a rule against barrel imports. In this template:

- `features/*/index.ts` and `domains/*/index.ts` are **public API boundaries** — not barrel anti-patterns
- Anti-patterns to avoid: re-exporting everything from `shared/` root, or importing directly from icon/component library index files

---

## Session Workflow Tips

<!-- For Claude Code — self-correction rules to apply within a session: -->

- **Lost / off track:** Stop → re-read CLAUDE.md, especially "Dependency Rules" and "Do NOT"
- **Need shared code:** Check `domains/*/index.ts` and `shared/` before writing anything new

<!-- For developers — how to start each type of session (move this to README.md):
- New feature:       read CLAUDE.md + domain doc + SPEC.md → implement types first, components last
- Bug fix:           read the feature SPEC.md for context → fix → verify no convention violations
- Cross-feature:     read SPEC.md of ALL involved features → communicate only via index.ts
-->
