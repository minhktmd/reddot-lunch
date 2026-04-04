# Next.js Production Template

A production-ready **Next.js 16+ (App Router)** project template designed for mid-size applications (10–20 screens). Built around **Feature-Oriented Architecture** and **Atomic Design**, and optimized for **Claude Code** workflows — where the human writes `.md` specs and the AI builds the code.

---

## What This Template Is

This is more than a blank project. It ships with two layers:

1. **Structural conventions** — folder layout, dependency rules, naming patterns, and a `CLAUDE.md` file that gives Claude Code everything it needs to implement features consistently without being re-instructed every session.

2. **Template code** — pre-wired boilerplate so you don't start from zero: the base HTTP client, environment config, logger, global providers, and more. Additional templates (example features, skeleton layouts, skill files for Claude Code) may be included depending on the variant — see [What's Included](#whats-included) below.

**Use this template when:**

- You are starting a mid-size Next.js project (10–20 features/screens)
- You want consistent architecture enforced from day one
- You are using Claude Code (or another AI coding assistant) to implement features from specs

**Do not use this template for:**

- Simple single-page tools or landing pages (too much structure)
- Projects that don't use the listed tech stack (conventions are stack-specific)

---

## Tech Stack

| Concern         | Technology                                      |
| --------------- | ----------------------------------------------- |
| Framework       | Next.js ≥ 16 / App Router                       |
| Language        | TypeScript 5.x                                  |
| Styling         | Tailwind CSS v4                                 |
| UI Components   | shadcn/ui                                       |
| Server State    | TanStack Query v5                               |
| Client State    | Zustand                                         |
| Validation      | Zod v4                                          |
| Forms           | React Hook Form v7 + `@hookform/resolvers` v5   |
| Notifications   | Sonner                                          |
| HTTP Client     | Custom Axios wrapper (`shared/services/api.ts`) |
| Package Manager | pnpm                                            |

---

## What's Included

### Always included

| Item                     | Location                             | Description                                                                    |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------ |
| Architecture conventions | `CLAUDE.md`                          | Full coding conventions, dependency rules, naming patterns                     |
| Doc templates            | `docs/`                              | `BRIEF.md`, `OVERVIEW.md`, `domains/` — ready to fill in                       |
| Feature SPEC template    | `src/features/_template/SPEC.md`     | Copy this when starting a new feature                                          |
| Base HTTP client         | `src/shared/services/api.ts`         | Axios instance with auth interceptor and error normalization                   |
| Env config               | `src/config/env.ts`                  | Typed, validated environment variables (throws on boot if missing)             |
| Route constants          | `src/config/routes.ts`               | Centralized route strings                                                      |
| Logger                   | `src/shared/lib/logger.ts`           | `log / warn / error` — silent in production for `log`                          |
| Global providers         | `src/shared/providers/`              | TanStack Query, Sonner, theme — composed and wired to `app/layout.tsx`         |
| Query key factory        | `src/shared/constants/query-keys.ts` | Centralized TanStack Query key management                                      |
| Claude Code skills       | `.claude/skills/`                    | Skill playbooks: `zustand-pattern`, `service-pattern`, `context-pattern`, etc. |

### Reference implementation (example domain + features)

The template ships with a **working example** you can read, run, and delete when you no longer need it. It demonstrates every layer of the architecture end-to-end — from domain types down to UI components.

| Item             | Location                                                        | Description                                                                 |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Finance domain   | `src/domains/finance/`                                          | Shared types, services, and hooks for financial operations                  |
| Deposit feature  | `src/features/deposit/`                                         | Complete feature: types → service → store → hooks → components → `index.ts` |
| Withdraw feature | `src/features/withdraw/`                                        | Same structure as Deposit — shows how two features share a domain           |
| Feature SPECs    | `src/features/deposit/SPEC.md`, `src/features/withdraw/SPEC.md` | Example of a fully written spec — use as a model for your own               |
| Domain doc       | `docs/domains/finance.md`                                       | Example domain documentation                                                |

> **These are reference files, not production code.** Delete `src/domains/finance/`, `src/features/deposit/`, `src/features/withdraw/`, and their corresponding doc files once you have written your own domain and first feature.

---

## Prerequisites

Before setting up the project, ensure the following are installed on your machine:

- **Node.js** ≥ 20.x — [nodejs.org](https://nodejs.org)
- **pnpm** ≥ 9.x — Install via `npm install -g pnpm`
- **Git**

---

## Setup

### 1. Use This Template

Click **"Use this template"** on GitHub, or clone directly:

```bash
git clone https://github.com/your-org/nextjs-production-template.git my-project
cd my-project
```

Remove the template's git history and start fresh:

```bash
rm -rf .git
git init
git add .
git commit -m "chore: init from template"
```

---

### 2. Install Dependencies

```bash
pnpm install
```

---

### 3. Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values. All environment variables are typed and validated at startup via `src/config/env.ts` — the app will throw on boot if any required variable is missing.

---

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** shadcn/ui is already initialized in this template. To add more components: `pnpm dlx shadcn@latest add <component>`

---

### 5. Verify the Build

Before pushing or deploying, always verify:

```bash
pnpm build        # Production build
pnpm type-check   # TypeScript — no emit
pnpm lint         # ESLint
```

---

## Project Customization

After setup, follow these steps to make the template your own:

### Step 1 — Study the reference implementation

Before deleting anything, read through the example domain and features. They are the fastest way to understand how the architecture works in practice:

- `docs/domains/finance.md` — how a domain doc is structured
- `src/features/deposit/SPEC.md` — how a feature spec is written
- `src/domains/finance/` — how a domain is organized
- `src/features/deposit/` or `src/features/withdraw/` — the full feature layer-by-layer

### Step 2 — Delete the example files

Once you understand the patterns, remove the reference implementation:

```bash
# Remove example domain and features
rm -rf src/domains/finance
rm -rf src/features/deposit
rm -rf src/features/withdraw

# Remove example documentation
rm docs/domains/finance.md
rm src/features/deposit/SPEC.md   # already removed with the folder above
rm src/features/withdraw/SPEC.md  # same
```

Also remove their routes from `src/app/` if any were wired up.

### Step 3 — Update the project metadata

| File                   | What to update                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `CLAUDE.md`            | Project name, description, feature map, tech stack (remove template notes block at top) |
| `docs/BRIEF.md`        | Raw product requirements in natural language                                            |
| `docs/OVERVIEW.md`     | Structured domain model and feature map                                                 |
| `src/config/env.ts`    | Environment variable schema for your project                                            |
| `src/config/site.ts`   | Site name, description, URLs                                                            |
| `src/config/routes.ts` | Route constants                                                                         |

---

## How to Add a Feature

Every feature lives in `src/features/<feature-name>/` and follows this workflow:

1. Write `src/features/<feature>/SPEC.md` — screens, API contracts, business rules, user stories
2. Write or update the relevant `docs/domains/<domain>.md` if shared domain knowledge is needed
3. Implement in this order: **types → services → stores → hooks → components → index.ts**
4. Wire up the route at `src/app/<route>/page.tsx` (thin wrapper only — no business logic)
5. Mark user stories `[x]` as they are completed in `SPEC.md`

When using Claude Code: point it at the SPEC.md file. The `CLAUDE.md` at the project root gives Claude Code everything it needs about conventions — you only need to provide the feature spec.

---

## Folder Structure Overview

```
src/
├── app/              → Routing only. Thin pages, no business logic.
├── features/         → One folder per product feature
├── domains/          → Shared domain logic used by 2+ features
├── shared/
│   ├── components/   → Atomic Design: atoms / molecules / organisms / templates
│   ├── hooks/        → Cross-feature hooks
│   ├── services/     → Base HTTP client (api.ts)
│   ├── stores/       → Global Zustand stores
│   ├── utils/        → Pure utility functions
│   ├── types/        → Shared TypeScript types
│   ├── constants/    → App-wide constants
│   └── providers/    → React context providers (composed in index.tsx)
└── config/
    ├── env.ts        → Typed, validated environment variables
    ├── routes.ts     → Route constants
    └── site.ts       → Site metadata
```

Full structure and dependency rules are documented in `CLAUDE.md`.

---

## Documentation Structure

The template ships with a documentation hierarchy that Claude Code reads in order:

```
CLAUDE.md                        ← Claude Code reads this first every session
docs/
├── BRIEF.md                     ← Raw requirements (natural language, owner-written)
├── OVERVIEW.md                  ← Structured product overview: domain model, feature map
└── domains/
    └── <domain>.md              ← Shared domain knowledge (auth, finance, etc.)

src/features/<feature>/
└── SPEC.md                      ← Source of truth for each feature
```

---

## Key Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm type-check   # TypeScript check (no emit)
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
```

---

## Architecture Principles

A few rules that define how this template is structured — full details in `CLAUDE.md`:

- **Dependency direction:** `app/ → features/ → domains/ → shared/` — never reversed
- **Feature isolation:** features never import from each other directly, only via `index.ts`
- **Atomic Design scope:** applies only inside `shared/components/` — features use flat `components/`
- **No business logic in `app/`:** pages are thin wrappers that compose feature components
- **API validation:** always use Zod `safeParse()` on API responses — never `.parse()`, never raw data
- **No `any`:** use `unknown` + type guards

---

## License

MIT
