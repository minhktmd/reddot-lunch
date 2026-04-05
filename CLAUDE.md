# CLAUDE.md

---

## Project

**Dat Com RDL** — A web app for managing daily lunch orders in an office of ~30–50 people. Replaces a Google Sheets workflow. No authentication — users identify themselves by selecting their name from a dropdown stored in `localStorage`.

---

## Tech Stack

| Concern       | Technology                                    |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 16 / App Router                       |
| Language      | TypeScript 5.x                                |
| Styling       | Tailwind CSS v4                               |
| UI Components | shadcn/ui                                     |
| Server State  | TanStack Query v5                             |
| Client State  | Zustand                                       |
| Validation    | Zod v4                                        |
| Forms         | React Hook Form v7 + @hookform/resolvers v5   |
| Notifications | Sonner                                        |
| HTTP Client   | `shared/services/api.ts` — custom fetch wrapper |
| ORM           | Prisma                                        |
| Database      | PostgreSQL via Supabase                       |
| File Storage  | Supabase Storage (QR code image)              |
| Slack         | Incoming Webhook + `chat.postMessage`         |
| Scheduling    | Vercel Cron Jobs                              |
| Package Manager | pnpm                                        |

---

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm type-check   # TypeScript check (no emit)
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
pnpm db:migrate   # Run Prisma migrations
pnpm db:studio    # Open Prisma Studio
```

---

## Documentation Hierarchy

Read in this order for full context:

1. **`docs/BRIEF.md`** — Raw requirements from owner (unedited, natural language)
2. **`docs/OVERVIEW.md`** — Structured product overview: domain model, feature map, API routes
3. **`docs/domains/<domain>.md`** — Shared domain knowledge (read the domain relevant to your task)
   - `docs/domains/employee.md` — Employee entity, role constants, identity (no auth)
   - `docs/domains/menu.md` — MenuItem, MenuOfDay, MenuOfDayItem, lifecycle, timezone helpers
   - `docs/domains/order.md` — Order, auto order, payment flow, cron
4. **`src/features/<feature>/SPEC.md`** — Feature-specific detail: screens, API contracts, business rules

---

## Folder Structure

### App

```
src/
├── app/                        → Routing only. Thin pages composing from features.
│   ├── layout.tsx              → Root layout + providers
│   ├── page.tsx                → F1: Home
│   ├── admin/
│   │   ├── page.tsx            → F2: Admin dashboard
│   │   ├── menu/page.tsx       → F3: Menu management
│   │   ├── settings/page.tsx   → F4: App settings
│   │   ├── employees/page.tsx  → F5: Employee management
│   │   ├── report/page.tsx     → F6: Monthly report
│   │   └── menu-items/page.tsx → F8: MenuItem management
│   └── api/                    → All API route handlers
│
├── features/                   → See "Feature Structure" below
├── domains/                    → See "Domain Structure" below
│
├── shared/
│   ├── components/             → Atomic Design (shared UI only)
│   │   ├── atoms/              → Button, Input, Badge, Icon, Spinner...
│   │   ├── molecules/          → FormField, SearchBar, NavItem, StatCard...
│   │   ├── organisms/          → Header, Sidebar, DataTable, Modal...
│   │   └── templates/          → AppShell, AdminLayout...
│   ├── constants/              → App-wide constants + query-keys.ts
│   ├── hooks/                  → Cross-feature hooks (useDebounce, useMediaQuery...)
│   ├── lib/                    → Wrappers: cn, logger, prisma, slack, supabase
│   ├── services/               → Base HTTP service (api.ts)
│   ├── stores/                 → Global Zustand stores (if any)
│   ├── utils/                  → Pure functions (format, parse, transform...)
│   ├── types/                  → common.types.ts (shared across all)
│   └── providers/              → Global contexts (composed in index.tsx)
│       ├── query-provider.tsx
│       ├── theme-provider.tsx
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
├── lib/                        [OPTIONAL] Feature-specific helpers
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
├── constants/                  [OPTIONAL] Domain-wide constants
├── lib/                        [OPTIONAL] Domain-specific helpers (e.g. date.ts for menu)
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

**Architecture:**

- ❌ Import internals from another feature — use `index.ts` only
- ❌ Put business logic in `src/app/` pages
- ❌ Let features import from each other outside of `index.ts`
- ❌ Duplicate domain types or logic inside individual features
- ❌ Create barrel exports at the `shared/` root

**Components:**

- ❌ Apply Atomic Design inside `features/` or `domains/` (flat components only)
- ❌ Let atoms import molecules, or molecules import organisms (respect atomic hierarchy)
- ❌ Put business logic inside shared components
- ❌ Create a new shared component for something used in only one feature
- ❌ Prop drilling beyond 2 levels — lift state to context or a state manager
- ❌ Direct DOM manipulation (`document.querySelector`...) — use `ref` instead
- ❌ Build custom atom components (Select, Checkbox, Dialog, Tabs, etc.) when a shadcn/ui component exists — always run `pnpm dlx shadcn@latest add <component>` first, then import from `@/components/ui/<component>`

**TypeScript:**

- ❌ Use `any` — use `unknown` + type guards
- ❌ Use `Promise<any>` as a service return type — use `Promise<void>` or a typed interface
- ❌ Use TypeScript `enum` — use `as const` + derived type (see `docs/domains/employee.md` for example)
- ❌ Use type assertion (`as SomeType`) to silence TypeScript — fix the type instead; only acceptable when narrowing from `unknown` after validation
- ❌ Access `process.env` directly — use `config/env.ts`
- ❌ Ignore error types from API responses

**Services & Data:**

- ❌ Use `fetch` or `axios` directly on the client — always use the base service from `shared/services/api.ts`
- ❌ Write inline query key arrays — always use the factory in `shared/constants/query-keys.ts`
- ❌ Skip Zod validation on API responses — always use `.safeParse()` and check `result.success` before using `result.data`

**Patterns:**

- ❌ Fetch data directly inside components — use hooks or TanStack Query
- ❌ Add files to `shared/` for logic that is only used by one feature
- ❌ Edit files outside the scope of the current SPEC.md (unless there is a clear reason)
- ❌ Leave `console.log` in committed code — use the logger or remove debug statements
- ❌ Silently swallow errors in `catch` blocks — always at minimum `logger.error` them

**Project-specific:**

- ❌ Use raw `new Date()` for date boundary logic — use `getTodayUTC()` from `src/domains/menu/lib/date.ts`
- ❌ Hard-delete employees or menu items — always soft delete (`isActive = false`)
- ❌ Insert `AppConfig` — always upsert with `where: { id: "singleton" }`
- ❌ Use `Promise.all` for fan-out Slack DMs — use `Promise.allSettled` so one failure doesn't block others

---

## How to Implement a Feature

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

### Code Style & Naming

- **Prettier:** semicolons, single quotes, 2-space indent, 120 print width, `es5` trailing commas
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
- **Types:** use `unknown` + type guards instead of `any`; prefer `type` over `interface` — use `interface` only when declaration merging is explicitly needed
- **Env vars:** always via `config/env.ts` — never `process.env` directly
- **Export types** from a feature via `index.ts` alongside components
- **UI strings:** all labels, buttons, messages shown to users must be in **Vietnamese**
- **Code & docs:** all code, variable names, comments, and documentation in **English**

**Naming conventions:**

| Type              | Convention                         | Example                                          |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| Files & folders   | kebab-case                         | `order-list.tsx`, `use-today-orders.ts`          |
| Components        | kebab-case file, PascalCase export | `order-list.tsx` → `export function OrderList()` |
| Hooks             | camelCase, `use` prefix            | `export function useTodayOrders()`               |
| Types/Interfaces  | PascalCase                         | `MenuOfDayResponse`, `OrderItem`                 |
| Zustand stores    | camelCase, `use` prefix            | `export const useHomeStore = create(...)`        |
| Service functions | camelCase, verb-first              | `getTodayMenu()`, `createOrder()`                |
| Zod schemas       | camelCase, `Schema` suffix         | `createOrderSchema`, `publishMenuSchema`         |

**File naming by folder:**

| Folder      | Pattern                      | Example                                          |
| ----------- | ---------------------------- | ------------------------------------------------ |
| `services/` | `[resource].service.ts`      | `order.service.ts`, `menu.service.ts`            |
| `types/`    | `[resource].type.ts`         | `order.type.ts`, `menu.type.ts`                  |
| `hooks/`    | `use-[action]-[resource].ts` | `use-today-orders.ts`, `use-publish-menu.ts`     |
| `components/` | `[feature]-[role].tsx`     | `order-list.tsx`, `menu-item-row.tsx`            |
| `stores/`   | `[resource].store.ts`        | `home.store.ts`, `menu-draft.store.ts`           |

**Schemas vs Types:**

- `types/` owns interfaces and types **not** derived from Zod (API response shapes, prop types, union types)
- Zod schemas: define in `types/[resource].type.ts`, co-located with the derived `z.infer` type
- Never duplicate — if a type is derived from Zod, use `z.infer<typeof schema>` only, do not redefine manually

### Components

- Always prefer shadcn/ui components over raw HTML elements for any interactive UI element. Before building a UI component, check shadcn/ui first. If it exists, install it with `pnpm dlx shadcn@latest add <component-name>`. shadcn/ui components live in `src/components/ui/` — always import from there.
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
└── templates/  Page-level layouts — slots for content, no business data (AppShell, AdminLayout)
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

### State Management

- Server state (from API) → TanStack Query
- Client state (UI state) → Zustand or `useState`
- Form state → React Hook Form + Zod resolver
- `selectedEmployeeId` persisted in `localStorage` — managed by `useHomeStore` in `features/home`
- Pre-publish menu draft (item list before publish) — managed by `useMenuDraftStore` in `features/menu-management`

**Zustand store rules:**

- Always named export (`export const use...`) — no default exports
- Extract `initialState` as a const — makes `reset()` reliable and DRY
- Add `persist` middleware only when state must survive page refresh (`useHomeStore` is the only current case)
- Keep stores flat — avoid deeply nested state shapes
- Actions (`set`) live inside the store — never mutate state from outside

→ Use skill `zustand-pattern` for full boilerplate

### API & Data Fetching

- **Client-side requests:** base service from `shared/services/api.ts`
- **Server-side requests (API routes):** Prisma directly — no HTTP client needed
- **Feature services:** `features/<feature>/services/` — always validate responses with Zod `safeParse()`, never `.parse()`
- **Domain services:** `domains/<domain>/services/` — shared API functions reused across multiple features
- **Mutations:** call `queryClient.invalidateQueries({ queryKey: queryKeys.x.all })` after every mutation
- **Query keys:** use the centralized factory in `shared/constants/query-keys.ts` — never write inline string arrays
- **Polling:** `use-today-menu` and `use-today-orders` refetch every 30s (`refetchInterval: 30_000`)

→ Use skill `service-pattern` for base service boilerplate, safeParse pattern, and mutation boilerplate

### Form Handling

- Stack: `react-hook-form` v7 + `zod` v4 + `@hookform/resolvers` v5
- `@hookform/resolvers` < v5 is incompatible with Zod v4 — always use v5+
- Always define Zod schema first → derive type with `z.infer<typeof schema>` → pass `zodResolver(schema)` to `useForm`
- **Field errors:** rendered inline below each field via `formState.errors`
- **Submit errors:** displayed via Sonner toast, not injected into form state

### Error Handling & Logging

- API errors → typed error response, displayed via Sonner toast
- Unexpected errors → error boundary component or fallback UI
- In `catch` blocks: always use `logger.error` — never silently swallow errors
- Slack errors in publish flow → log with `logger.error` but do NOT fail the publish request

**Logger** (`shared/lib/logger.ts`):

- `logger.log` — debug only, hidden in production
- `logger.warn` — always visible
- `logger.error` — always visible

### Prisma

- Always import from `@/shared/lib/prisma` — never instantiate `PrismaClient` directly in features
- `AppConfig`: always `upsert` with `where: { id: "singleton" }` — never `create`
- Soft delete: always set `isActive = false` — never `delete` employees or menu items
- Timezone: always use `getTodayUTC()` from `src/domains/menu/lib/date.ts` for date boundaries

### Price & Date Formatting

- **Prices:** display as `{n.toLocaleString("vi-VN")}đ` (e.g. `45.000đ`) — store as integer VND
- **Dates:** display as `dd/MM/yyyy` (e.g. `04/04/2026`)
- **Time:** display as `HH:mm` (e.g. `13:30`)

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

- `scope`: optional, kebab-case feature or module name (`home`, `menu`, `order`, `employee`)
- `description`: imperative mood, lowercase, no trailing period ("add" not "added")
- Breaking change: append `!` after type — `feat!: change publish API contract`

```bash
feat(home): add order form with optimistic UI
fix(menu): handle empty prefill when no previous menu exists
refactor(order): extract auto order logic to domain service
chore: update prisma to v6
```

---

## Feature Map (Quick Reference)

| #  | Feature              | Route                | Domain            | Status  |
| -- | -------------------- | -------------------- | ----------------- | ------- |
| F1 | Home                 | `/`                  | employee, order   | Planned |
| F2 | Admin Dashboard      | `/admin`             | order, menu       | Planned |
| F3 | Menu Management      | `/admin/menu`        | menu, order       | Planned |
| F4 | App Settings         | `/admin/settings`    | —                 | Planned |
| F5 | Employee Management  | `/admin/employees`   | employee          | Planned |
| F6 | Monthly Report       | `/admin/report`      | order, employee   | Planned |
| F7 | Slack Notifications  | events + cron        | order, menu       | Planned |
| F8 | MenuItem Management  | `/admin/menu-items`  | menu              | Planned |

---

## Skills

### Project skills (available in `.claude/skills/`)

| Skill               | Use when                                             |
| ------------------- | ---------------------------------------------------- |
| `const-map-pattern` | Creating a const map, derived type, or options array |
| `context-pattern`   | Creating a new React Context                         |
| `service-pattern`   | Creating a service function, query hook, or mutation |
| `zustand-pattern`   | Creating a Zustand store                             |
| `form-pattern`      | Creating a form with React Hook Form + Zod           |
| `error-handling`    | Implementing error boundary, toast, or logger        |

### Community skills

| Skill                         | Use when                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `vercel-react-best-practices` | Writing components, data fetching, optimization                                      |
| `vercel-composition-patterns` | Designing shared components                                                          |
| `next-best-practices`         | Next.js file conventions, RSC boundaries, async APIs, metadata, image/font, bundling |

`features/*/index.ts` and `domains/*/index.ts` are **public API boundaries** — not barrel anti-patterns. Anti-patterns to avoid: re-exporting everything from `shared/` root, or importing icon/component libraries through their index.

---

## Session Workflow Tips

- **Lost / off track:** Stop → re-read CLAUDE.md, especially "Dependency Rules" and "Do NOT"
- **Need shared code:** Check `domains/*/index.ts` and `shared/` before writing anything new
- **Timezone bug:** always trace back to `getTodayUTC()` — never trust raw `new Date()`
- **Slack not sending:** check `slackId` is set, log error but do not fail the parent operation