# SPEC: Monthly Report (F6)

> Admin page for viewing monthly order and payment statistics.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/employee.md`.
> Route: `/admin/report`

---

## Overview

Admin uses this page to review monthly lunch costs per employee — useful for accounting, reimbursement, or cost tracking. Data can be exported as CSV.

---

## Screen

### Month Selector

```
[◀] Tháng 3, 2026 [▶]
```

- Defaults to current month on page load
- Navigate month by month with prev/next arrows
- On change: refetch report data for selected month

---

### Summary Table

One row per employee, sorted by name asc. Only employees who have at least one order in the selected month are shown.

| Tên | Số ngày | Số suất | Tổng tiền | Đã trả | Còn nợ |
|---|---|---|---|---|---|
| Hoàng Đỗ | 18 | 20 | 900.000đ | 900.000đ | 0đ |
| Duy Nghĩa | 15 | 16 | 720.000đ | 630.000đ | 90.000đ |
| Hiếu | 20 | 22 | 990.000đ | 0đ | 990.000đ |

Column definitions:
- **Số ngày** — distinct days the employee had at least one order
- **Số suất** — total `SUM(order.quantity)` for the month
- **Tổng tiền** — `SUM(order.quantity × menuOfDayItem.price)` for the month
- **Đã trả** — sum of orders where `isPaid = true`
- **Còn nợ** — sum of orders where `isPaid = false`

**Footer row:**

| Tổng | — | N suất | X.000đ | Y.000đ | Z.000đ |

---

### Expandable Row Detail

Clicking a row expands it to show per-day breakdown for that employee:

| Ngày | Món | SL | Đơn giá | Thành tiền | Trạng thái |
|---|---|---|---|---|---|
| 01/03/2026 | Cơm gà Hội An | 1 | 45.000đ | 45.000đ | Đã trả |
| 01/03/2026 | Phở gà HN | 1 | 45.000đ | 45.000đ | Đã trả |
| 04/03/2026 | Cơm thịt kho tàu | 2 | 45.000đ | 90.000đ | Chưa trả |

- Sorted by date asc
- Multiple orders on the same day each shown as a separate row
- "Trạng thái" = `Đã trả` or `Chưa trả`

---

### CSV Export

"Xuất CSV" button above the table → downloads a CSV file.

**Filename:** `bao-cao-thang-03-2026.csv`

**CSV format — summary level:**

```
Tên,Số ngày,Số suất,Tổng tiền,Đã trả,Còn nợ
Hoàng Đỗ,18,20,900000,900000,0
Duy Nghĩa,15,16,720000,630000,90000
```

- Amounts as raw integers (no formatting) for easy spreadsheet import
- UTF-8 with BOM (`\uFEFF`) to ensure Vietnamese characters display correctly in Excel

---

## User Stories

- [ ] US1: Admin sees monthly summary table for the current month by default
- [ ] US2: Admin can navigate to previous and next months
- [ ] US3: Admin sees number of days ordered, total portions, total amount, paid, and outstanding per employee
- [ ] US4: Admin can expand an employee row to see per-day order detail
- [ ] US5: Admin sees a footer row with totals across all employees
- [ ] US6: Admin can export the monthly summary as a CSV file
- [ ] US7: CSV file has correct Vietnamese characters when opened in Excel

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load monthly report | GET | `/api/report/monthly?month=YYYY-MM` | — |
| Load employee detail | GET | `/api/report/employee/[id]?month=YYYY-MM` | — |

### GET /api/report/monthly response shape

```ts
type MonthlyReportRow = {
  employee: { id: string; name: string }
  daysOrdered: number
  totalPortions: number
  totalAmount: number   // VND, integer
  paidAmount: number
  unpaidAmount: number
}

type MonthlyReportResponse = {
  month: string         // "YYYY-MM"
  rows: MonthlyReportRow[]
}
```

### GET /api/report/employee/[id] response shape

```ts
type EmployeeDailyOrder = {
  date: string          // "YYYY-MM-DD"
  menuItemName: string
  quantity: number
  unitPrice: number
  subtotal: number
  isPaid: boolean
}

type EmployeeReportResponse = {
  employee: { id: string; name: string }
  month: string
  orders: EmployeeDailyOrder[]
}
```

---

## Component Structure

```
features/monthly-report/
├── components/
│   ├── report-month-selector.tsx    — Prev/next month navigation
│   ├── report-summary-table.tsx     — Main table with expandable rows
│   ├── report-summary-row.tsx       — Single employee row (collapsed)
│   ├── report-detail-row.tsx        — Expanded per-day breakdown
│   ├── report-footer-row.tsx        — Totals footer
│   └── report-export-button.tsx     — CSV export button
├── hooks/
│   ├── use-monthly-report.ts        — GET /api/report/monthly?month=
│   └── use-employee-report.ts       — GET /api/report/employee/[id]?month=
└── index.ts
```

---

## Notes

- **CSV generation** — done client-side from the already-loaded report data; no extra API call needed
- **UTF-8 BOM** — prepend `\uFEFF` to CSV string before creating the Blob so Excel renders Vietnamese correctly
- **Empty month** — if no orders exist for the selected month, show: `"Không có dữ liệu cho tháng này"`
- **Lazy load detail** — `use-employee-report` is only called when admin expands a row, not on page load
- **Amount formatting** — display as `{n.toLocaleString("vi-VN")}đ` in UI; raw integers in CSV