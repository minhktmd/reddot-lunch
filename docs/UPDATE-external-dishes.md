# UPDATE: External Dishes (Món ăn ngoài)

> **Type:** Feature addition — affects F3 (Menu Management) and F1 (Home).
> **Scope:** DB schema migration + 2 API route changes + UI in 2 features.
> **Delete this file** once implementation is complete and all user stories are checked off.

---

## What This Feature Is

Admin can attach **external dish links** to today's menu — for employees who want to order from Grab, ShopeeFood, Be, Foody, etc. instead of the standard menu. Each external dish has a `name` and an `orderUrl`.

These are **display-only**. No orders tracked, no payment managed, no quantity counted. Employees click the link and complete the order entirely outside the system.

Key design decisions:
- Stored as a `Json` column on `MenuOfDay` — no separate DB table
- Editable from **Screen 1 before publish** — held in Zustand store alongside menu items
- Sent to server together with standard items in the publish request
- Post-publish edits write directly to DB via a dedicated PATCH route
- **A menu with only external dishes and no standard items is valid** — admin can publish on days when the whole office orders externally

---

## What Needs to Change

### A. This implementation is a correction of an earlier partial implementation

The feature was previously implemented with the external dishes section **hidden on Screen 1** (pre-publish). This was wrong. The correct behavior is:

- External dishes section is **always visible** — on Screen 1, Screen 2, and Screen 3
- On Screen 1: edits go into the Zustand store (not the DB)
- On Screen 2: edits write directly to the DB
- On Screen 3: read-only

### B. Publish validation was wrong

Previously: publish required at least one standard dish. This blocked external-dishes-only days.

Correct validation: publish requires **at least one standard dish OR at least one external dish**.

---

## Data Model Change

Add one column to `MenuOfDay` in `prisma/schema.prisma`:

```prisma
model MenuOfDay {
  id              String          @id @default(cuid())
  date            DateTime        @unique
  isPublished     Boolean         @default(false)
  isLocked        Boolean         @default(false)
  externalDishes  Json            @default("[]")  // ExternalDishItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  items           MenuOfDayItem[]
  orders          Order[]

  @@map("menu_of_days")
}
```

Run `pnpm db:migrate` after schema change.

---

## TypeScript Type

Add to `src/domains/menu/types/menu.type.ts`:

```ts
export type ExternalDishItem = {
  name: string
  orderUrl: string
}
```

Update `MenuOfDayResponse` to include:
```ts
externalDishes: ExternalDishItem[]
```

---

## API Changes

### 1. Update `GET /api/menu/today`

Include `externalDishes` in the response — cast from Prisma `Json`:

```ts
externalDishes: (menu.externalDishes as ExternalDishItem[]) ?? []
```

### 2. Update `POST /api/menu/publish`

Accept `externalDishes` in the request body alongside `items`:

```ts
// Updated Zod schema
const publishMenuSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1),
    price: z.number().int().positive(),
    sideDishes: z.string().optional(),
  })),
  externalDishes: z.array(z.object({
    name: z.string().min(1),
    orderUrl: z.string().url(),
  })),
})
```

**Updated validation:** return `400` if `items.length === 0 && externalDishes.length === 0`.

**Updated DB write** — store `externalDishes` when creating the `MenuOfDay`:
```ts
await prisma.menuOfDay.create({
  data: {
    date: getTodayUTC(),
    isPublished: true,
    externalDishes: validatedBody.externalDishes,
    items: { createMany: { data: validatedBody.items } },
  },
})
```

**Auto orders:** only run if `validatedBody.items.length > 0` — no auto order on external-dishes-only days.

### 3. New route: `PATCH /api/menu/[id]/external-dishes`

Full array replacement, post-publish only.

```ts
const saveExternalDishesSchema = z.object({
  externalDishes: z.array(z.object({
    name: z.string().min(1),
    orderUrl: z.string().url(),
  })),
})
```

Guards:
- `404` if `MenuOfDay` not found
- `403` if `isLocked = true`

Response: `200` with `{ externalDishes: ExternalDishItem[] }`

---

## Zustand Store Changes (`menu-draft.store.ts`)

Add external dishes to the draft store:

```ts
type DraftExternalDish = {
  tempId: string   // client-only key, never sent to server
  name: string
  orderUrl: string
}

// Add to MenuDraftStore:
externalDishes: DraftExternalDish[]
addExternalDish: (dish: Omit<DraftExternalDish, 'tempId'>) => void
removeExternalDish: (tempId: string) => void
setExternalDishes: (dishes: DraftExternalDish[]) => void
```

`reset()` must also clear `externalDishes`.

These store actions are used **pre-publish only**. Post-publish, the live list comes from TanStack Query cache.

---

## F3: Menu Management Changes

### menu-external-section.tsx (new component)

Container that renders differently based on `isPublished` and `isLocked`:

| State | Add form | Delete buttons | Data source |
|---|---|---|---|
| Screen 1 (pre-publish) | ✅ visible | ✅ visible | Zustand store |
| Screen 2 (published, unlocked) | ✅ visible | ✅ visible | TanStack Query cache |
| Screen 3 (locked) | ❌ hidden | ❌ hidden | TanStack Query cache |

### menu-external-row.tsx (new component)

Single row: name + truncated URL with tooltip + delete button (3s red confirm pattern).

### menu-external-add-form.tsx (new component)

Inline add form: name input + URL input + "Thêm" button. Validates URL with `z.string().url()` on submit.

### use-save-external-dishes.ts (new hook)

`PATCH /api/menu/[id]/external-dishes` mutation. On success: invalidate `queryKeys.menu.today()`.

The component derives the full new array before calling the mutation:
- Add: `[...currentList, newItem]`
- Remove: `currentList.filter(d => d !== item)`

### Wire into page

`<MenuExternalSection />` renders below the menu table on **all three screens**.

### Publish button change

Update `menu-publish-button.tsx` validation:
```ts
// Before (wrong):
const canPublish = draftItems.some(i => i.name && i.price > 0)

// After (correct):
const canPublish =
  draftItems.some(i => i.name && i.price > 0) ||
  draftExternalDishes.length > 0
```

Error message when both empty: `"Thêm ít nhất một món ăn hoặc một món ăn ngoài trước khi đăng"`

### Kitchen summary

Hide `<MenuKitchenSummary />` on external-dishes-only days (when `menu.items.length === 0`).

---

## F1: Home Changes

### order-external-dishes.tsx (new component)

Section with heading + one row per external dish (name + link button). Hidden when array is empty.

Each link: `<a href={item.orderUrl} target="_blank" rel="noopener noreferrer">`.

### Where it renders in order-tab.tsx

After the standard section (menu cards + order list), in States B and C:

```tsx
{menu.externalDishes.length > 0 && (
  <OrderExternalDishes items={menu.externalDishes} />
)}
```

### External-dishes-only day handling in order-tab.tsx

```tsx
const hasStandardItems = menu.items.length > 0
const hasExternalDishes = menu.externalDishes.length > 0

// Only render standard section when standard items exist
{hasStandardItems && (
  <>
    <OrderMenuCards ... />
    <OrderList ... />
  </>
)}

// Always render external dishes when present
{hasExternalDishes && (
  <OrderExternalDishes items={menu.externalDishes} />
)}
```

---

## Implementation Order

1. `prisma/schema.prisma` — add `externalDishes Json @default("[]")` → run `pnpm db:migrate`
2. `src/domains/menu/types/menu.type.ts` — add `ExternalDishItem`, update `MenuOfDayResponse`
3. `src/app/api/menu/today/route.ts` — include `externalDishes` in response
4. `src/app/api/menu/publish/route.ts` — accept `externalDishes` in body, fix validation, store on create, conditionally run auto orders
5. `src/app/api/menu/[id]/external-dishes/route.ts` — new PATCH handler
6. `src/features/menu-management/stores/menu-draft.store.ts` — add `externalDishes` state + actions
7. `src/features/menu-management/hooks/use-save-external-dishes.ts` — new hook
8. `src/features/menu-management/components/menu-external-add-form.tsx` — new component
9. `src/features/menu-management/components/menu-external-row.tsx` — new component
10. `src/features/menu-management/components/menu-external-section.tsx` — new component
11. Update `menu-publish-button.tsx` — fix validation logic and error message
12. Update kitchen summary — hide on external-dishes-only days
13. Wire `<MenuExternalSection />` into the menu management page (all three screens, below menu table)
14. `src/features/home/components/order-external-dishes.tsx` — new component
15. Update `order-tab.tsx` — wire `<OrderExternalDishes />`, handle external-dishes-only day
16. Update `index.ts` exports for both features
17. Run `pnpm type-check` — fix all errors before stopping

---

## User Stories to Mark Done

**F3 SPEC:** US8–US23 (replacing the old US8 which had wrong validation)
**F1 SPEC:** US13–US16