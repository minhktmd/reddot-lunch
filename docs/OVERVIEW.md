# OVERVIEW.md

> Structured product overview — the technical map of the entire system.
> Derived from `docs/BRIEF.md`. Read this before any domain doc or feature SPEC.
> Implementation details (schema, code, business rules) → `docs/domains/*.md`.
> Feature detail → `src/features/*/SPEC.md`.

---

## Product Summary

**Dat Com RDL** — A web app for managing daily lunch orders in an office of ~30–50 people. Replaces a Google Sheets workflow. No authentication — users identify themselves by selecting their name from a dropdown stored in `localStorage`.

**Platform:** Web (mobile-first). Hosted on Vercel + Prisma Postgres.

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
LedgerEntry     — a financial transaction: top-up, order debit, or admin adjustment
AppConfig       — singleton row; holds bank account info for VietQR payment generation
```

`MenuOfDay` also carries an `externalDishes` JSON column — a list of off-menu delivery links
(e.g. Grab, ShopeeFood) that admin can attach to a day. These are display-only: no orders, no
payment, no quantity tracking. Employees click the link and transact entirely outside the system.

Note: There is **no separate MenuItem catalog entity**. Dish names are stored directly on `MenuOfDayItem` as plain strings. Autocomplete in the menu editor is sourced from historical `MenuOfDayItem` records.

### Relationships

```
Employee      ──< Order              one employee → many orders across days
Employee      ──< LedgerEntry        one employee → full financial history
MenuOfDay     ──< MenuOfDayItem      one daily menu → many meal portions
MenuOfDay     ──< Order              one daily menu → many orders
MenuOfDayItem ──< Order              one meal portion → chosen by many orders
```

### Key constraints

- One employee can have **multiple Orders on the same day** (different meal types) — no unique constraint on `(menuOfDayId, employeeId)`
- Each Order has `quantity >= 1`
- **No `isPaid` / `paidAt` on Order** — payment state is replaced by the ledger system
- `AppConfig` always has exactly one row (`id = "singleton"`) — always upsert, never insert
- `AppConfig` holds `bankCode` (VietQR BIN), `bankAccount`, `bankAccountName` — used to generate QR codes client-side; no file storage
- `MenuOfDayItem` is unique by `(menuOfDayId, name)` — one dish name per day per menu
- `MenuOfDay.externalDishes` is a JSON array `[{ name, orderUrl }]` — no separate table, no order/payment tracking
- A menu can be published with only external dishes and no standard items — valid for external-order-only days
- Schema → `docs/domains/*.md`

---

## Lunch Fund System

Every employee has a **virtual balance** in the lunch fund:
- Positive = pre-paid, can order freely
- Zero / Negative = owes money; can still order (no hard block)

Balance is never stored directly — it is computed as `SUM(LedgerEntry.amount)` for each employee.

| Entry type | When written | Amount |
|---|---|---|
| `topup` | Member submits top-up, or admin adds on behalf | Positive VND |
| `order_debit` | Order is created (same DB transaction) | Negative VND |
| `order_debit` deleted | Order is cancelled (same DB transaction) | — |
| `adjustment` | Admin sets a specific target balance | Signed VND (delta) |

Admin monitors the **total fund balance** = SUM of all employee balances. A negative total means admin must cover the shortfall.

Full details → `docs/domains/ledger.md`

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
- **External dishes** — admin can attach off-menu delivery links to today's menu; stored as JSON array on `MenuOfDay.externalDishes`; display-only — no order or payment tracking
- **Lunch fund** — employees maintain a balance by topping up via bank transfer (self-reported); each order automatically debits their balance; admin manages corrections and monitors total fund → details in `docs/domains/ledger.md`
- **Negative balance allowed** — employees can order even when balance is zero or negative; system shows warning prominently but never blocks ordering
- **VietQR** — payment QR codes are generated client-side from `AppConfig` bank fields; no file storage; `addInfo` format: `RDL - {name without diacritics} chuyen tien an trua`
- **Menu editing is store-first** — all edits happen in Zustand store; DB writes only on explicit publish or "Lưu thay đổi" → details in `docs/domains/menu.md`
- **Autocomplete from history** — dish name suggestions come from historical `MenuOfDayItem` records → `GET /api/menu/suggestions`
- **Identity** — no auth; employee selects name on first visit, saved to `localStorage`

---

## Slack Integration (summary)

| Event | Target | When |
|---|---|---|
| Menu published | Channel post | On publish |
| Auto order created | Employee DM | On publish |
| Menu items updated | Channel post | On "Lưu thay đổi" — only when items actually changed |
| External dishes updated | Channel post | On external dish add/remove — only when resulting list non-empty |
| Menu locked | Channel post | On "Chốt sổ" |
| Balance reminder | Channel post | Cron 13:00 daily — employees with negative balance |

Details + message templates → `docs/domains/order.md`, `src/features/slack-notifications/SPEC.md`

---

## Feature Map

### Employee-facing

| # | Feature | Route | Description |
|---|---|---|---|
| F1 | Home | `/` | Name selection → Order tab + Finance tab (balance, top-up, history) + auto order toggle |

### Admin-facing

| # | Feature | Route | Description |
|---|---|---|---|
| F2 | Admin Dashboard | `/admin` | Daily overview: orders placed, meal summary, balance quick-view |
| F3 | Menu Management | `/admin/menu` | Create/edit daily menu, external dish links, publish, lock |
| F4 | App Settings | `/admin/settings` | Configure bank account (for VietQR generation), manage AppConfig |
| F5 | Employee Management | `/admin/employees` | CRUD employees, set role, email, slackId, autoOrder |
| F6 | Finance Management | `/admin/finance` | Fund overview, per-employee balances, adjustments, top-up on behalf |
| F7 | Slack Notifications | events + cron | Publish trigger + 13:00 balance reminder |

---

## API Routes

```
# Config
GET    /api/config                        — Get AppConfig (bankCode, bankAccount, bankAccountName)
POST   /api/config/bank                   — Save bank account info, update AppConfig

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
PATCH  /api/menu/[id]/items               — Batch replace all items on a published menu
PATCH  /api/menu/[id]/external-dishes     — Replace the full external dishes list

# Orders
GET    /api/orders/today                  — All orders for today (admin view)
GET    /api/orders?employeeId=&date=      — Orders for one employee on a specific date
POST   /api/orders                        — Create order { employeeId, menuOfDayItemId, quantity }
PATCH  /api/orders/[id]                   — Update order (change item or quantity)
DELETE /api/orders/[id]                   — Cancel order

# Finance / Ledger
GET    /api/finance/balance?employeeId=   — Current balance for one employee
GET    /api/finance/ledger?employeeId=    — Full ledger history for one employee
GET    /api/finance/summary               — All employee balances + total fund balance (admin)
POST   /api/finance/topup                 — Add top-up entry { employeeId, amount, createdBy? }
POST   /api/finance/adjust                — Admin sets target balance { employeeId, targetBalance, note?, adminEmployeeId }
GET    /api/finance/fund-ledger?month=    — Fund timeline for a month (admin)

# Cron
POST   /api/cron/remind-payment           — Post balance reminder to Slack (runs at 13:00)
                                            Requires: Authorization: Bearer CRON_SECRET
```

Note: `/api/orders/unpaid`, `/api/orders/pay`, `/api/orders/unpay` have been **removed** — payment state is no longer on Order.

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
│   │   └── finance/page.tsx              → F6: Finance management
│   └── api/                              → All API route handlers
│
├── features/
│   ├── home/                             → F1
│   ├── admin-dashboard/                  → F2
│   ├── menu-management/                  → F3
│   ├── app-settings/                     → F4
│   ├── employee-management/              → F5
│   ├── finance/                          → F6
│   └── slack-notifications/              → F7
│
├── domains/
│   ├── menu/                             → MenuOfDay, MenuOfDayItem shared logic
│   ├── order/                            → Order logic, auto order
│   ├── employee/                         → Employee logic, role constants
│   └── ledger/                           → LedgerEntry, balance computation
│
└── shared/
    ├── services/api.ts
    ├── lib/
    │   ├── prisma.ts
    │   └── slack.ts
    ├── utils/
    │   ├── viet-qr.ts                    → buildVietQRUrl()
    │   └── text.ts                       → removeDiacritics()
    ├── constants/query-keys.ts
    └── providers/
```

---

## Infrastructure

| Service | Purpose | Tier |
|---|---|---|
| Vercel | Next.js hosting + Cron Jobs | Free |
| Prisma Postgres | PostgreSQL database (via Prisma Accelerate) | Free |
| VietQR CDN | Payment QR code image generation (client-side, no account needed) | Free |
| Slack Incoming Webhook | Channel posts | Free |
| Slack Bot API | Direct messages (`chat.postMessage`) | Free |

---

## Environment Variables

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
SLACK_BOT_TOKEN="xoxb-..."
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
NEXT_PUBLIC_APP_URL="https://datcom.company.com"
TZ="Asia/Ho_Chi_Minh"
CRON_SECRET="random-secret-string"
```

Note: `BLOB_READ_WRITE_TOKEN` has been **removed** — Vercel Blob is no longer used. Bank account info is stored in the DB (`AppConfig`); QR codes are generated client-side via VietQR.

---

## Timezone

All "today" logic uses **Asia/Ho_Chi_Minh (UTC+7)**. Never use raw `new Date()` for date boundary logic.
Details + helpers → `docs/domains/menu.md`

---

## Key UX Principles

1. **≤ 3 steps** to place an order: select name → select meal → submit
2. **Mobile-first** — employees order from their phones
3. **State always visible** — has the menu been published? have I ordered? what is my balance?
4. **Name persists** — `localStorage` saves selected name; returning users skip name selection
5. **Optimistic UI** — order appears immediately after submit
6. **Slack links** go directly to the right page — no extra navigation
7. **Batch writes** — menu editing never triggers per-action API calls; all buffered in store

---

## Language Convention

| Context | Language |
|---|---|
| Code, file names, variable names, comments | English |
| UI labels, buttons, messages shown to users | Vietnamese |
| Documentation (`.md` files) | English |