# OVERVIEW.md

> Structured product overview — the technical map of the entire system.
> Derived from `docs/BRIEF.md`. Read this before any domain doc or feature SPEC.
> Implementation details (schema, code, business rules) → `docs/domains/*.md`.
> Feature detail → `src/features/*/SPEC.md`.

---

## Product Summary

**Dat Com RDL** — A web app for managing daily lunch orders in an office of ~30–50 people. Replaces a Google Sheets workflow. No authentication — users identify themselves by selecting their name from a dropdown stored in `localStorage`.

**Platform:** Web (mobile-first). Hosted on Vercel + Prisma Postgres + Vercel Blob.

---

## User Roles

| Role | How identified | Access |
|---|---|---|
| **Member** | Selects name from dropdown on first visit | `/` only |
| **Admin** | `Employee.role = "admin"` | `/` + all `/admin/*` routes |

- No login, no session, no tokens — all routes are publicly accessible
- `role` is used only for Slack notification routing, not for access control
- Multiple admins are allowed

---

## Domain Model

### Entities

```
Employee        — a person in the office; name, email?, slackId?, role, autoOrder flag
MenuOfDay       — the daily menu created by admin; lifecycle: draft → published → locked
MenuOfDayItem   — a meal portion on a specific day (name + price + sideDishes stored directly)
Order           — one meal portion ordered by one employee on one day
AppConfig       — singleton row; holds global settings (QR code URL)
```

`MenuOfDay` also carries an `externalDishes` JSON column — a list of off-menu delivery links
(e.g. Grab, ShopeeFood) that admin can attach to a day. These are display-only: no orders, no
payment, no quantity tracking. Employees click the link and transact entirely outside the system.

Note: There is **no separate MenuItem catalog entity**. Dish names are stored directly on `MenuOfDayItem` as plain strings. Autocomplete in the menu editor is sourced from historical `MenuOfDayItem` records.

### Relationships

```
Employee      ──< Order              one employee → many orders across days
MenuOfDay     ──< MenuOfDayItem      one daily menu → many meal portions
MenuOfDay     ──< Order              one daily menu → many orders
MenuOfDayItem ──< Order              one meal portion → chosen by many orders
```

### Key constraints

- One employee can have **multiple Orders on the same day** (different meal types) — no unique constraint on `(menuOfDayId, employeeId)`
- Each Order has `quantity >= 1`
- Payment state lives directly on `Order` (`isPaid`, `paidAt`) — no separate Payment entity
- `AppConfig` always has exactly one row (`id = "singleton"`) — always upsert, never insert
- `MenuOfDayItem` is unique by `(menuOfDayId, name)` — one dish name per day per menu
- `MenuOfDay.externalDishes` is a JSON array `[{ name, orderUrl }]` — no separate table, no order/payment tracking
- A menu can be published with only external dishes and no standard items — valid for external-order-only days
- Schema → `docs/domains/*.md`

---

## MenuOfDay Lifecycle

```
DRAFT ──→ PUBLISHED ──→ LOCKED
               ↑____________↓  (admin can unlock)
```

| State | isPublished | isLocked | Employee can order? | Admin can edit items? |
|---|---|---|---|---|
| Draft | false | false | No | Yes (store only, no DB) |
| Published | true | false | Yes | Yes (batch save via "Lưu thay đổi") |
| Locked | true | true | No | No |

Full transition logic → `docs/domains/menu.md`

---

## Key Business Rules (summary)

- **Auto order** — when admin publishes menu, employees with `autoOrder = true` and no existing order for today get a random dish ordered for them automatically → details in `docs/domains/order.md`
- **External dishes** — admin can attach off-menu delivery links to today's menu (Grab, ShopeeFood, etc.); stored as a JSON array on `MenuOfDay.externalDishes`; editable from Screen 1 before publish; a menu with only external dishes and no standard items is valid; display-only on the home page — no order or payment tracking
- **Payment** — employee pays all unpaid orders at once via bank transfer + QR code; no partial payment → details in `docs/domains/order.md`
- **Menu editing is store-first** — all edits (pre-publish and post-publish) happen in the Zustand store; DB writes happen only on explicit publish or "Lưu thay đổi" action → details in `docs/domains/menu.md`
- **Autocomplete from history** — when admin types a dish name, suggestions come from historical `MenuOfDayItem` records (deduplicated by name, most recent price); no separate catalog → `GET /api/menu/suggestions`
- **Identity** — no auth; employee selects name on first visit, saved to `localStorage` as `selectedEmployeeId`

---

## Slack Integration (summary)

| Event | Target | When |
|---|---|---|
| Menu published | Channel post | On publish |
| Auto order created | Employee DM | On publish |
| Payment reminder | Channel post | Cron 13:00 daily |

Details + message templates → `docs/domains/order.md`, `src/features/slack-notifications/SPEC.md`

---

## Feature Map

### Employee-facing

| # | Feature | Route | Description |
|---|---|---|---|
| F1 | Home | `/` | Name selection on first visit → Order tab (menu + external dish links) + Payment tab + auto order toggle |

### Admin-facing

| # | Feature | Route | Description |
|---|---|---|---|
| F2 | Admin Dashboard | `/admin` | Daily overview: orders placed, meal summary, payment status |
| F3 | Menu Management | `/admin/menu` | Create/edit daily menu, manage external dish links (available from Screen 1), publish, lock |
| F4 | App Settings | `/admin/settings` | Upload QR code image, manage AppConfig |
| F5 | Employee Management | `/admin/employees` | CRUD employees, set role, email, slackId, autoOrder |
| F6 | Monthly Report | `/admin/report` | Per-employee monthly cost breakdown, CSV export |
| F7 | Slack Notifications | events + cron | Publish trigger + 13:00 payment reminder |

Note: F8 (MenuItem Management) has been removed. There is no dish catalog to manage.

---

## API Routes

```
# Config
GET    /api/config                        — Get AppConfig (qrCodeUrl)
POST   /api/config/qr                     — Upload new QR image to Vercel Blob, update AppConfig

# Employees
GET    /api/employees                     — List active employees
POST   /api/employees                     — Create employee
PATCH  /api/employees/[id]                — Update name, email, slackId, role, autoOrder, isActive

# Menu
GET    /api/menu/today                    — Today's MenuOfDay if exists; else { status: "no-menu" }
GET    /api/menu/suggestions              — Deduplicated dish name+price from history (for autocomplete)
POST   /api/menu/publish                  — Create MenuOfDay + all items, publish, trigger Slack + auto orders
POST   /api/menu/[id]/lock                — Lock orders
POST   /api/menu/[id]/unlock              — Unlock orders
PATCH  /api/menu/[id]/items               — Batch replace all items on a published menu (one request)
PATCH  /api/menu/[id]/external-dishes     — Replace the full external dishes list (one request, post-publish only)

# Orders
GET    /api/orders/today                  — All orders for today (admin view)
GET    /api/orders?employeeId=&date=      — Orders for one employee on a specific date
GET    /api/orders/unpaid?employeeId=     — All unpaid orders for one employee (all time)
POST   /api/orders                        — Create order { employeeId, menuOfDayItemId, quantity }
PATCH  /api/orders/[id]                   — Update order (change item or quantity)
DELETE /api/orders/[id]                   — Cancel order
PATCH  /api/orders/pay                    — Pay all unpaid { employeeId } → isPaid=true, paidAt=now
PATCH  /api/orders/unpay                  — Undo payment { employeeId, date } → isPaid=false, paidAt=null

# Report
GET    /api/report/monthly?month=YYYY-MM  — Monthly stats for all employees
GET    /api/report/employee/[id]?month=   — Monthly detail for one employee

# Cron
POST   /api/cron/remind-payment           — Post payment reminder to Slack (runs at 13:00)
                                            Requires: Authorization: Bearer CRON_SECRET
```

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx                          → F1: Home
│   ├── admin/
│   │   ├── page.tsx                      → F2: Admin dashboard
│   │   ├── menu/page.tsx                 → F3: Menu management
│   │   ├── settings/page.tsx             → F4: App settings
│   │   ├── employees/page.tsx            → F5: Employee management
│   │   └── report/page.tsx               → F6: Monthly report
│   └── api/                              → All API route handlers
│
├── features/
│   ├── home/                             → F1
│   ├── admin-dashboard/                  → F2
│   ├── menu-management/                  → F3
│   ├── app-settings/                     → F4
│   ├── employee-management/              → F5
│   ├── monthly-report/                   → F6
│   └── slack-notifications/              → F7
│
├── domains/
│   ├── menu/                             → MenuOfDay, MenuOfDayItem shared logic
│   ├── order/                            → Order logic, auto order, payment state
│   └── employee/                         → Employee logic, role constants
│
└── shared/
    ├── services/api.ts                   → Base HTTP client
    ├── lib/
    │   ├── prisma.ts                     → Prisma client singleton
    │   ├── slack.ts                      → postChannel(), postDM(), getAdminSlackIds()
    │   └── blob.ts                       → Vercel Blob upload helper (QR code)
    ├── constants/query-keys.ts
    └── providers/
```

---

## Infrastructure

| Service | Purpose | Tier |
|---|---|---|
| Vercel | Next.js hosting + Cron Jobs | Free |
| Prisma Postgres | PostgreSQL database (via Prisma Accelerate) | Free |
| Vercel Blob | QR code image (`payment-qr`) | Free |
| Slack Incoming Webhook | Channel posts | Free |
| Slack Bot API | Direct messages (`chat.postMessage`) | Free |

---

## Environment Variables

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
SLACK_BOT_TOKEN="xoxb-..."
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
SLACK_CHANNEL_ID="C0XXXXXXX"
NEXT_PUBLIC_APP_URL="https://datcom.company.com"
TZ="Asia/Ho_Chi_Minh"
CRON_SECRET="random-secret-string"
```

Full variable list with descriptions → `src/config/env.ts`

---

## Timezone

All "today" logic uses **Asia/Ho_Chi_Minh (UTC+7)**. Never use raw `new Date()` for date boundary logic.
Details + helpers → `docs/domains/menu.md`

---

## Key UX Principles

1. **≤ 3 steps** to place an order: select name → select meal → submit
2. **Mobile-first** — employees order from their phones
3. **State always visible** — has the menu been published? have I ordered? do I owe money?
4. **Name persists** — `localStorage` saves selected name; returning users skip name selection
5. **Optimistic UI** — order appears immediately after submit
6. **Slack links** go directly to the right page — no extra navigation
7. **Batch writes** — menu editing never triggers per-action API calls; all changes buffered in store and saved in one request

---

## Language Convention

| Context | Language |
|---|---|
| Code, file names, variable names, comments | English |
| UI labels, buttons, messages shown to users | Vietnamese |
| Documentation (`.md` files) | English |