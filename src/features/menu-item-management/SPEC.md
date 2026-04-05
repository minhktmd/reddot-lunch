# SPEC: MenuItem Management (F8)

> Admin page for managing the dish catalog.
> Domain knowledge → `docs/domains/menu.md`.
> Route: `/admin/menu-items`

---

## Overview

Admin uses this page to manage the `MenuItem` catalog — the reusable list of dish names that powers the autocomplete in Menu Management (F3).

Most `MenuItem` records are created automatically when admin types a new dish name in F3. This page exists for housekeeping: renaming dishes, deactivating stale ones, or adding dishes in advance.

---

## Screen

Single page — table of all menu items (active and inactive) with inline add form at the top.

### MenuItem Table

| Tên món | Ngày tạo | Trạng thái | |
|---|---|---|---|
| Cơm gà Hội An | 01/01/2026 | Hoạt động | [Sửa] [Vô hiệu] |
| Phở gà HN | 05/02/2026 | Hoạt động | [Sửa] [Vô hiệu] |
| Bún bò (cũ) | 10/12/2025 | Không hoạt động | [Sửa] [Kích hoạt] |

- Default sort: active first, then inactive; within each group sorted by name asc
- Inactive rows shown with muted styling
- "Vô hiệu" → sets `isActive = false` — hides from autocomplete in F3
- "Kích hoạt" → sets `isActive = true`

### Add MenuItem Form

Form cố định phía trên bảng:

```
[Tên món *] [Thêm]
```

- `Tên` là bắt buộc
- On submit: `POST /api/menu-items` → new row appears at top of active list, form resets to empty

### Edit MenuItem

Clicking "Sửa" expands an inline edit form within the row:

```
[Tên món *] [Lưu] [Hủy]
```

- Pre-filled with current name
- On save: `PATCH /api/menu-items/[id]` with `{ name }`
- On cancel: discard changes, collapse form

---

## User Stories

- [ ] US1: Admin sees all menu items — active and inactive — in a single table
- [ ] US2: Admin can add a new menu item manually
- [ ] US3: Admin can rename an existing menu item
- [ ] US4: Admin can deactivate a menu item — it disappears from the autocomplete in F3
- [ ] US5: Admin can reactivate an inactive menu item
- [ ] US6: Inactive menu items are visually distinct but still visible in the table

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load all menu items | GET | `/api/menu-items?includeInactive=true` | — |
| Add menu item | POST | `/api/menu-items` | `{ name }` |
| Edit menu item | PATCH | `/api/menu-items/[id]` | `{ name?, isActive? }` |

Note: `GET /api/menu-items` without params returns active items only (used for autocomplete in F3). This page passes `?includeInactive=true` to get all.

---

## Component Structure

```
features/menu-item-management/
├── components/
│   ├── menu-item-table.tsx         — Full table with active + inactive rows
│   ├── menu-item-row.tsx           — Single row (view mode)
│   ├── menu-item-row-edit.tsx      — Inline edit form within a row
│   └── menu-item-add-form.tsx      — Add new menu item form above table
├── hooks/
│   ├── use-menu-items-all.ts       — GET /api/menu-items?includeInactive=true
│   ├── use-add-menu-item.ts        — POST /api/menu-items
│   └── use-edit-menu-item.ts       — PATCH /api/menu-items/[id]
└── index.ts
```

---

## Notes

- **No hard delete** — deactivating is the only removal option; historical `MenuOfDayItem` records still reference the `MenuItem`
- **Renaming** — changing a `MenuItem` name updates it everywhere it appears (autocomplete, future menus); historical records reflect the new name too since they join on `menuItemId`
- **Deactivation does not affect past data** — existing `MenuOfDayItem` and `Order` records are unaffected; only the autocomplete in F3 is impacted
- **Duplicate names** — system should warn (not block) if admin tries to add a name that already exists (case-insensitive match)