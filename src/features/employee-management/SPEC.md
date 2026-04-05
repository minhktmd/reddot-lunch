# SPEC: Employee Management (F5)

> Admin page for managing the employee list.
> Domain knowledge → `docs/domains/employee.md`.
> Route: `/admin/employees`

---

## Overview

Admin uses this page to:

1. View all employees (active and inactive)
2. Add new employees
3. Edit employee details — name, email, Slack ID, role
4. Deactivate (soft delete) or reactivate employees

This is a simple CRUD page. No complex business logic.

---

## Screen

Single page — table of all employees with inline add form at the top.

### Employee Table

| Tên | Email | Slack ID | Vai trò | Tự động đặt | Trạng thái | |
|---|---|---|---|---|---|---|
| Hoàng Đỗ | hoang@co.com | U012AB3CD | Admin | ✓ | Hoạt động | [Sửa] [Vô hiệu] |
| Duy Nghĩa | — | — | Thành viên | — | Hoạt động | [Sửa] [Vô hiệu] |
| Hiếu (cũ) | — | — | Thành viên | — | Không hoạt động | [Sửa] [Kích hoạt] |

- Default sort: active employees first, then inactive; within each group sorted by name asc
- `Admin` or `Thành viên` in the role column
- "Tự động đặt" column shows checkmark if `autoOrder = true`, dash if false
- Inactive employees shown with muted styling (greyed out row)
- "Vô hiệu" → sets `isActive = false`
- "Kích hoạt" → sets `isActive = true`

### Add Employee Form

Inline form above the table:

```
[Tên *] [Email] [Slack ID] [Vai trò ▾] [Thêm]
```

- `Tên` is required — all other fields optional
- `Vai trò` dropdown: `Thành viên` (default) / `Admin`
- On submit: `POST /api/employees` → new row appears at top of active list

### Edit Employee

Clicking "Sửa" expands an inline edit form within the row (not a modal):

```
[Tên *] [Email] [Slack ID] [Vai trò ▾] [Lưu] [Hủy]
```

- Pre-filled with current values
- On save: `PATCH /api/employees/[id]`
- On cancel: discard changes, collapse form

---

## User Stories

- [ ] US1: Admin sees all employees — active and inactive — in a single table
- [ ] US2: Admin can add a new employee with name only (other fields optional)
- [ ] US3: Admin can add a new employee with full details (name, email, slackId, role)
- [ ] US4: Admin can edit an employee's name, email, Slack ID, and role
- [ ] US5: Admin can deactivate an employee (soft delete)
- [ ] US6: Admin can reactivate an inactive employee
- [ ] US7: Inactive employees are visually distinct but still visible in the table

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load all employees | GET | `/api/employees?includeInactive=true` | — |
| Add employee | POST | `/api/employees` | `{ name, email?, slackId?, role? }` |
| Edit employee | PATCH | `/api/employees/[id]` | `{ name?, email?, slackId?, role?, isActive? }` |

Note: `GET /api/employees` without params returns active employees only (used for dropdowns elsewhere). This page passes `?includeInactive=true` to get all.

---

## Component Structure

```
features/employee-management/
├── components/
│   ├── employee-table.tsx          — Full table with active + inactive rows
│   ├── employee-row.tsx            — Single employee row (view mode)
│   ├── employee-row-edit.tsx       — Inline edit form within a row
│   └── employee-add-form.tsx       — Add new employee form above table
├── hooks/
│   ├── use-employees-all.ts        — GET /api/employees?includeInactive=true
│   ├── use-add-employee.ts         — POST /api/employees
│   └── use-edit-employee.ts        — PATCH /api/employees/[id]
└── index.ts
```

---

## Notes

- **No hard delete** — deactivating is the only removal option; historical order data must remain intact
- **autoOrder field** — shown as read-only in this table; employees toggle it themselves on the home page; admin cannot change it here
- **Slack ID helper text** — show in the edit form: `"Slack member ID, ví dụ: U012AB3CD"` — not a username or email
- **Role change** — only affects which Slack notifications the employee receives; no access control implications