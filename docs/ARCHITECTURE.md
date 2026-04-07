# ARCHITECTURE.md

> Technical decisions, rationale, and patterns for the Dat Com RDL project.
> This file explains *why* things are built the way they are.
> What to build → `docs/OVERVIEW.md`. How to build it → `CLAUDE.md`.

---

## Overview

Dat Com RDL is a full-stack Next.js application. Both frontend and backend live in the same repository and are deployed together on Vercel. There is no separate backend service.

```
Browser
  └── Next.js (Vercel)
        ├── React components (client-side)
        └── API Route Handlers (server-side)
              ├── Prisma → Prisma Postgres (via Accelerate)
              ├── Vercel Blob (QR code)
              └── Slack API
```

---

## Full-Stack in Next.js App Router

### How backend code is organized

Next.js API routes (`src/app/api/`) act as the backend. They are thin handlers — parse, validate, delegate, respond:

```ts
// src/app/api/orders/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const result = createOrderSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  const order = await createOrder(result.data)  // business logic in service
  return NextResponse.json(order)
}
```

Business logic is never written inside route handlers. It lives in:

| Layer | Location | Responsibility |
|---|---|---|
| Route handler | `src/app/api/` | Parse request, validate input, call service, return response |
| Feature service | `src/features/*/services/` | Business logic specific to one feature |
| Domain service | `src/domains/*/services/` | Business logic shared across multiple features |
| Shared lib | `src/shared/lib/` | External integrations: Prisma, Slack, Vercel Blob |

### Why not a separate backend?

- Office tool with ~30–50 users — no scale requirement justifying the complexity
- All infrastructure on free tier — Vercel hosts both frontend and API
- Prisma runs fine in Next.js serverless functions
- Simpler deployment: one repo, one build, one deploy

---

## Database — Prisma Postgres via Prisma Accelerate

### Why Prisma

- Type-safe queries — no raw SQL, no runtime type mismatches
- Schema-first — `schema.prisma` is the single source of truth for the DB structure
- Migration history — `prisma migrate` tracks schema changes over time
- Prisma Studio — visual DB browser for debugging

### Prisma client singleton

Next.js dev server hot-reloads frequently, which would create multiple `PrismaClient` instances and exhaust DB connections. The singleton pattern prevents this:

```ts
// src/shared/lib/prisma.ts
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof makePrisma> | undefined
}

function makePrisma() {
  return new PrismaClient().$extends(withAccelerate())
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

Always import `prisma` from `@/shared/lib/prisma` — never instantiate `PrismaClient` elsewhere. Prisma Postgres requires the `withAccelerate()` extension — never create a bare `PrismaClient` without it.

### Why Prisma Postgres

- No cold start — eliminates the 3–4s latency that plagued the previous Supabase free tier setup
- Same platform as Prisma ORM — seamless integration via `DATABASE_URL`
- Optimized for serverless — built-in connection pooling via Prisma Accelerate

---

## Timezone Strategy

All "today" logic uses **Asia/Ho_Chi_Minh (UTC+7)**. This is the most error-prone area of the codebase.

### The problem

`new Date()` in a Vercel serverless function returns UTC time. At 23:00 UTC, it is already 06:00 the next day in Ho Chi Minh City. Without timezone handling, "today's menu" would return the wrong day for 7 hours every night.

### The solution

`MenuOfDay.date` is always stored as `00:00:00 UTC` representing midnight Asia/Ho_Chi_Minh of that calendar day. All date boundary queries use the helpers in `src/domains/menu/lib/date.ts`:

```ts
// Always use these — never raw new Date()
getTodayUTC()            // today's date key for DB storage/query
parseDateParam(str)      // parse YYYY-MM-DD route param for DB query
```

### Why store as UTC midnight of the local day?

Storing `2026-04-04T00:00:00+07:00` as `2026-04-03T17:00:00Z` in the DB allows simple `@unique` on the `date` field and straightforward equality queries without timezone conversion at query time.

---

## Authentication — None

There is no authentication. All routes including `/admin/*` are publicly accessible.

### Why no auth

- Internal office tool — the URL is not publicly shared
- Replacing a Google Sheet — no auth existed before
- 30–50 known users in the same office — risk of unauthorized access is accepted
- Adding auth would add significant complexity (session management, middleware, protected routes)

### Identity instead of auth

Users identify themselves by selecting their name from a dropdown. The selected `employeeId` is saved to `localStorage`. This is not secure — anyone can impersonate anyone — but it is sufficient for the use case.

`role = "admin"` exists only to route Slack notifications to the right people. It does not gate any routes or actions.

---

## Pre-publish Menu Pattern

### The problem

If the system auto-cloned the previous day's menu into the DB every morning, it would create orphaned records on weekends, holidays, or days when the restaurant is closed.

### The solution

Nothing is written to the DB until admin clicks "Đăng thực đơn". Until then:

1. `GET /api/menu/today` checks if a `MenuOfDay` exists for today
2. If not → queries the most recent previous `MenuOfDay` and returns its items as `prefill`
3. The UI renders the prefill items as an editable draft (Zustand store — `useMenuDraftStore`)
4. `POST /api/menu/publish` creates `MenuOfDay` + all `MenuOfDayItem` records atomically

This means: if admin never publishes, no DB record is ever created for that day.

### Why atomic publish

The publish operation does several things at once (create menu, create auto orders, send Slack). Using a Prisma transaction for the DB writes ensures consistency — if auto order creation fails, the menu is not left in a half-published state:

```ts
await prisma.$transaction(async (tx) => {
  const menu = await tx.menuOfDay.create({ ... })
  await tx.menuOfDayItem.createMany({ ... })
  await tx.order.createMany({ ... })  // auto orders
})
// Slack is called AFTER the transaction — failures don't roll back DB
```

---

## Slack Integration

### Two mechanisms

| Mechanism | Used for | Why |
|---|---|---|
| Incoming Webhook | Channel posts | Simpler — no bot setup, just a URL |
| Bot API (`chat.postMessage`) | Direct messages | Webhooks cannot send DMs |

### Failure isolation

Slack calls are always outside DB transactions and always use `Promise.allSettled` for fan-out DMs:

```ts
// After DB transaction succeeds:
await Promise.allSettled(
  employees.map(e => e.slackId ? postDM(e.slackId, message) : Promise.resolve())
)
```

If Slack is down or a DM fails, the publish operation still succeeds. Slack errors are logged with `logger.error` but never surfaced to the user as a failure.

### Why `Promise.allSettled` not `Promise.all`

`Promise.all` rejects immediately if any DM fails — one bad `slackId` would silently skip all remaining DMs. `Promise.allSettled` sends all DMs regardless of individual failures.

---

## Vercel Blob — QR Code

### Pattern

One fixed path: `payment-qr`. Every upload overwrites this file via `addRandomSuffix: false`.

```ts
// src/shared/lib/blob.ts
export async function uploadQRCode(file: File): Promise<string> {
  const { url } = await put("payment-qr", file, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  })
  return `${url}?t=${Date.now()}`  // cache-bust
}
```

### Why `?t=timestamp` on the URL

Browsers aggressively cache images by URL. Since the filename never changes, without cache-busting the browser would show the old QR image after an upload. Appending the upload timestamp forces a fresh fetch.

---

## Vercel Cron

### Schedule

```json
{ "path": "/api/cron/remind-payment", "schedule": "0 6 * * 1-5" }
```

`0 6 * * 1-5` = 06:00 UTC = 13:00 Asia/Ho_Chi_Minh, Monday–Friday only.

### Security

Vercel injects `Authorization: Bearer {CRON_SECRET}` on every cron request. The route handler validates this header before doing any work. Without this, anyone who discovers the URL could trigger the cron manually.

### Idempotency

The cron handler checks for a published menu and unpaid orders before posting to Slack. Running it twice (e.g. if Vercel retries) would post a duplicate message, but this is acceptable given the low stakes of the reminder.

---

## Client-Side Data Fetching

### TanStack Query for all server state

All API calls from the browser go through TanStack Query hooks. No `useEffect` + `fetch` patterns.

Benefits:
- Automatic caching and deduplication
- Consistent loading/error states across components
- `invalidateQueries` after mutations keeps the UI in sync
- `refetchInterval` for polling (menu state, order list — every 30s)

### Optimistic updates

Order mutations (place, edit, cancel) use optimistic updates — the UI reflects the change immediately without waiting for the server. On error, TanStack Query rolls back to the previous state automatically.

### Query key factory

All query keys are defined in `src/shared/constants/query-keys.ts`. This prevents typos and makes `invalidateQueries` reliable:

```ts
export const queryKeys = {
  menu: {
    today: () => ["menu", "today"] as const,
    byDate: (date: string) => ["menu", date] as const,
  },
  orders: {
    today: () => ["orders", "today"] as const,
    byEmployee: (employeeId: string, date: string) => ["orders", employeeId, date] as const,
    unpaid: (employeeId: string) => ["orders", "unpaid", employeeId] as const,
  },
  // ...
}
```

---

## Payment Design — No Payment Entity

### Why `isPaid` on `Order` instead of a separate `Payment` model

A separate `Payment` model would imply tracking individual payment transactions — when each was made, by which method, etc. For this use case:

- Employees pay all at once via bank transfer
- Admin confirms or undoes payment per employee per day
- No partial payments, no payment methods, no transaction IDs

`isPaid: boolean` + `paidAt: DateTime?` directly on `Order` is sufficient and keeps the schema simple. Bulk payment = `updateMany` on all unpaid orders for an employee.

---

## Why No Separate MenuItem CRUD Was Needed Initially

`MenuItem` records are created automatically when admin types a new dish name in the menu form. The catalog grows organically through daily use without admin ever visiting a management page.

The `/admin/menu-items` page (F8) was added for housekeeping — renaming stale dishes, deactivating ones no longer used. It is not required for the core daily workflow.