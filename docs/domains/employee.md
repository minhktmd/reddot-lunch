# Domain: Employee

> Schema, business rules, and helpers for the Employee entity.
> Big picture → `docs/OVERVIEW.md`.
> Feature detail → `src/features/employee-management/SPEC.md`, `src/features/home/SPEC.md`.

---

## Prisma Schema

```prisma
model Employee {
  id        String   @id @default(cuid())
  name      String
  email     String?
  slackId   String?
  role      String   @default("member")  // "admin" | "member"
  autoOrder Boolean  @default(false)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  orders    Order[]

  @@map("employees")
}
```

### Field notes

| Field | Notes |
|---|---|
| `name` | Display name shown in dropdowns across the app |
| `email` | Optional — not used for auth, informational only |
| `slackId` | Slack member ID (e.g. `U0XXXXXXX`). No value = no DMs sent to this employee |
| `role` | `"admin"` or `"member"` — used only for Slack notification routing, not access control |
| `autoOrder` | Toggled by the employee on home page `/` — persisted to DB immediately on toggle |
| `isActive` | Soft delete — inactive employees hidden from dropdowns and excluded from all listings |

---

## Role Constants

Never use TypeScript enums. Use `as const`:

```ts
// src/domains/employee/constants/employee-role.constant.ts
export const EMPLOYEE_ROLE = {
  ADMIN: "admin",
  MEMBER: "member",
} as const

export type EmployeeRole = typeof EMPLOYEE_ROLE[keyof typeof EMPLOYEE_ROLE]
```

### What "admin" means

- Receives admin-targeted Slack notifications if `slackId` is set
- No route-level access control — `/admin/*` routes are publicly accessible to everyone
- Multiple employees can have `role = "admin"`

---

## Business Rules

### Soft Delete

- Never hard-delete an employee — set `isActive = false`
- Inactive employees: hidden from name dropdowns, excluded from auto order, excluded from all admin listings
- Historical `Order` records remain intact and still reference the employee

### Auto Order Flag

- Toggled by the employee themselves on the home page — not by admin
- `PATCH /api/employees/[id]` with `{ autoOrder: boolean }` — persisted immediately, no confirmation needed
- Controls whether the employee receives an auto order when admin publishes the daily menu
- Full auto order logic → `docs/domains/order.md`

### Slack DMs

- A Slack DM is only sent if `slackId` is set and non-empty
- `slackId` is the Slack member ID — format: `U` followed by alphanumeric characters (e.g. `U012AB3CD`)
- Set and managed by admin in `/admin/employees` — employees cannot set their own `slackId`

---

## Identity (No Auth)

- No login — employee identity established by selecting a name from a dropdown on first visit
- Selected `employeeId` saved to `localStorage` key `selectedEmployeeId`
- On subsequent visits: read from `localStorage` → skip name selection → show order form directly
- Ordering on behalf of someone else: change dropdown to that person → place order normally
- The system records only which `employeeId` an order belongs to — it does not track who submitted it

---

## API Response Shapes

### GET /api/employees

Returns all active employees (`isActive = true`), ordered by `name` asc. Used for dropdowns.

```ts
type EmployeeListItem = {
  id: string
  name: string
  email: string | null
  slackId: string | null
  role: EmployeeRole
  autoOrder: boolean
  isActive: boolean
  createdAt: string
}
```

### PATCH /api/employees/[id] — accepted fields

```ts
type UpdateEmployeeInput = {
  name?: string
  email?: string | null
  slackId?: string | null
  role?: EmployeeRole
  autoOrder?: boolean
  isActive?: boolean
}
```

All fields are optional — only provided fields are updated.

---

## Shared Components (`src/domains/employee/`)

- `EmployeeSelect` — dropdown to select an employee by name; used on the home page and in admin views. Props: `value`, `onChange`, `disabled?`