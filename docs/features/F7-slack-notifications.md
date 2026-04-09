# SPEC: Slack Notifications (F7)

> Event-driven and scheduled Slack messages.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/menu.md`, `docs/domains/employee.md`, `docs/domains/ledger.md`.
> No UI — this feature is purely server-side logic.

---

## Overview

Five types of Slack messages, all channel posts except auto order DMs:

| # | Type | Trigger | Target |
|---|---|---|---|
| 1 | Menu published | Admin clicks "Đăng thực đơn" | Channel |
| 2 | Auto order created | Part of publish flow | Employee DM (per eligible employee) |
| 3 | Menu items updated | Admin saves post-publish item changes (only when DB actually changed) | Channel |
| 4 | External dishes updated | Admin adds/removes external dishes post-publish (only when list non-empty after change) | Channel |
| 5 | Menu locked | Admin clicks "Chốt sổ" | Channel |
| 6 | Balance reminder | Vercel Cron at 13:00 weekdays | Channel |

All Slack logic lives in `shared/lib/slack.ts`. This feature wires up the helpers into the publish, save-items, save-external-dishes, lock, and cron flows.

---

## Message Templates

### 1. Menu Published — Channel Post

Sent to the Slack channel via Incoming Webhook when admin publishes today's menu.

```
📋 Thực đơn hôm nay ({weekday}, {dd/MM/yyyy}):

• {dish name 1} — {price}đ{sideDishes ? " (" + sideDishes + ")" : ""}
• {dish name 2} — {price}đ
...

👉 Đặt cơm tại đây: {NEXT_PUBLIC_APP_URL}
```

Example:
```
📋 Thực đơn hôm nay (Thứ Tư, 04/04/2026):

• Cơm gà Hội An — 45.000đ (Nộm, canh bầu, chả cá)
• Cơm thịt kho tàu — 45.000đ
• Phở gà HN — 45.000đ (Quẩy, hoa quả)

👉 Đặt cơm tại đây: https://datcom.company.com
```

---

### 2. Auto Order Created — Employee DM

Sent via `chat.postMessage` to each employee who received an auto order.

```
🍱 Hôm nay hệ thống tự đặt cho bạn: {dish name} x1 — {price}đ.
Muốn đổi hoặc hủy, vào đây trước khi admin chốt sổ: {NEXT_PUBLIC_APP_URL}
```

Only sent if `employee.slackId` is set and non-empty.

---

### 3. Balance Reminder — Channel Post

Sent to the Slack channel via Incoming Webhook at 13:00 every weekday.

```
💰 {count} người đang có số dư âm. Vào đây để nạp tiền: {NEXT_PUBLIC_APP_URL}
```

Only sent when:
- A published menu exists for today
- At least one active employee has a negative balance (`count > 0`)

---

### 4. Menu Items Updated — Channel Post

Sent to the Slack channel when admin saves post-publish item changes via "Lưu thay đổi" **and the items actually changed** (compared to what was in the DB before the save).

```
✏️ Admin vừa cập nhật thực đơn hôm nay ({weekday}, {dd/MM/yyyy}):

• {dish name 1} — {price}đ{sideDishes ? " (" + sideDishes + ")" : ""}
• {dish name 2} — {price}đ
...

👉 Xem và đặt cơm tại đây: {NEXT_PUBLIC_APP_URL}
```

Example:
```
✏️ Admin vừa cập nhật thực đơn hôm nay (Thứ Tư, 04/04/2026):

• Cơm gà Hội An — 45.000đ (Nộm, canh bầu, chả cá)
• Bún bò Huế — 40.000đ

👉 Xem và đặt cơm tại đây: https://datcom.company.com
```

**"Actually changed" rule:** The API route compares the saved item set (by `name + price + sideDishes`) against what was in the DB before the PATCH. If the resulting set is identical, skip the Slack call. This prevents noise when admin accidentally triggers "Lưu thay đổi" without making real changes.

---

### 5. External Dishes Updated — Channel Post

Sent to the Slack channel when admin adds or removes an external dish post-publish via `PATCH /api/menu/[id]/external-dishes`. Only sent when the resulting list is **non-empty** (removing the last external dish sends nothing).

```
🛵 Admin vừa cập nhật món ăn ngoài cho hôm nay:

• {name 1} — {orderUrl 1}
• {name 2} — {orderUrl 2}
```

Example:
```
🛵 Admin vừa cập nhật món ăn ngoài cho hôm nay:

• Bún sườn chua — Trần Huy Liệu — https://grab.onelink.me/...
• Cơm tấm Kiều Giang — https://shopeefood.vn/...

```

---

### 6. Menu Locked — Channel Post

Sent to the Slack channel when admin clicks "Chốt sổ" (`POST /api/menu/[id]/lock`).

```
🔒 Admin đã chốt danh sách đặt cơm hôm nay. Đơn đã được gửi đi rồi!
Nếu bạn chưa đặt, vui lòng tự lo bữa trưa nhé! 🍜
```

---

## Shared Helpers (`shared/lib/slack.ts`)

```ts
export async function postChannel(message: string): Promise<void> {
  await fetch(env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  })
}

export async function postDM(slackId: string, message: string): Promise<void> {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({ channel: slackId, text: message }),
  })
}

export async function getAdminSlackIds(): Promise<string[]> {
  const admins = await prisma.employee.findMany({
    where: { role: EMPLOYEE_ROLE.ADMIN, isActive: true, slackId: { not: null } },
    select: { slackId: true },
  })
  return admins.map(a => a.slackId!)
}
```

---

## Publish Flow Integration

The publish API route (`POST /api/menu/publish`) calls Slack helpers after DB writes succeed:

```ts
// After MenuOfDay + MenuOfDayItems + auto orders are created:

// 1. Post channel message
await postChannel(buildMenuPublishedMessage(menuOfDay, items, appUrl))

// 2. Send DMs to auto-order employees
await Promise.allSettled(
  autoOrderResults.map(({ employee, menuOfDayItem }) => {
    if (!employee.slackId) return Promise.resolve()
    return postDM(employee.slackId, buildAutoOrderMessage(menuOfDayItem, appUrl))
  })
)
```

`Promise.allSettled` — Slack failures must not block the publish response. If Slack is down, the menu is still published successfully.

---

## Menu Items Updated Flow Integration

The save-items API route (`PATCH /api/menu/[id]/items`) calls the Slack helper **after** DB writes succeed, but **only when items actually changed**:

```ts
// After diffing and applying DB changes:
const itemsChanged = didItemsChange(itemsBefore, itemsAfter)  // compare (name, price, sideDishes) sets

if (itemsChanged) {
  await postChannel(buildMenuUpdatedMessage(menuOfDay.date, itemsAfter, appUrl)).catch(
    (err) => logger.error("Slack menu-updated notification failed", err)
  )
}
```

`didItemsChange` compares the two item lists by their `(name, price, sideDishes)` tuples — order-independent. If admin saves with zero real changes, Slack is not called.

---

## External Dishes Updated Flow Integration

The external dishes API route (`PATCH /api/menu/[id]/external-dishes`) calls the Slack helper **after** DB write succeeds, but **only when the resulting list is non-empty**:

```ts
// After saving externalDishes to DB:
if (updatedExternalDishes.length > 0) {
  await postChannel(buildExternalDishesUpdatedMessage(updatedExternalDishes)).catch(
    (err) => logger.error("Slack external-dishes notification failed", err)
  )
}
```

Removing the last external dish → list becomes empty → no Slack call.

---

## Menu Locked Flow Integration

The lock API route (`POST /api/menu/[id]/lock`) calls the Slack helper after DB write succeeds:

```ts
// After setting isLocked = true:
await postChannel(buildMenuLockedMessage()).catch(
  (err) => logger.error("Slack menu-locked notification failed", err)
)
```

---

## Cron Route (`/api/cron/remind-payment`)

Called by Vercel Cron at 06:00 UTC (= 13:00 Asia/Ho_Chi_Minh) on weekdays.

```ts
// 1. Verify cron secret
const auth = request.headers.get("Authorization")
if (auth !== `Bearer ${env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// 2. Check if today has a published menu
const menu = await prisma.menuOfDay.findFirst({
  where: { date: getTodayUTC(), isPublished: true },
})
if (!menu) return NextResponse.json({ ok: true, skipped: "no menu today" })

// 3. Find active employees with negative balance
// Balance = SUM(ledgerEntries.amount) per employee
const grouped = await prisma.ledgerEntry.groupBy({
  by: ["employeeId"],
  _sum: { amount: true },
})

const inDebtCount = grouped.filter(g => (g._sum.amount ?? 0) < 0).length
if (inDebtCount === 0) {
  return NextResponse.json({ ok: true, skipped: "no one in debt" })
}

// 4. Post reminder
await postChannel(
  `💰 ${inDebtCount} người đang có số dư âm. Vào đây để nạp tiền: ${env.NEXT_PUBLIC_APP_URL}`
)

return NextResponse.json({ ok: true, reminded: inDebtCount })
```

### Vercel Cron Config (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/remind-payment",
      "schedule": "0 6 * * 1-5"
    }
  ]
}
```

`0 6 * * 1-5` = 06:00 UTC = 13:00 Asia/Ho_Chi_Minh, Monday–Friday only.

---

## Message Builder Helpers

Live in `src/features/slack-notifications/lib/`:

```ts
// build-menu-published-message.ts
export function buildMenuPublishedMessage(
  date: Date,
  items: { menuItemName: string; price: number; sideDishes: string | null }[],
  appUrl: string
): string {
  const weekday = formatInTimeZone(date, "Asia/Ho_Chi_Minh", "EEEE", { locale: vi })
  const dateStr = formatInTimeZone(date, "Asia/Ho_Chi_Minh", "dd/MM/yyyy")
  const itemLines = items
    .map(i => {
      const sides = i.sideDishes ? ` (${i.sideDishes})` : ""
      return `• ${i.menuItemName} — ${i.price.toLocaleString("vi-VN")}đ${sides}`
    })
    .join("\n")
  return `📋 Thực đơn hôm nay (${weekday}, ${dateStr}):\n\n${itemLines}\n\n👉 Đặt cơm tại đây: ${appUrl}`
}

// build-auto-order-message.ts
export function buildAutoOrderMessage(
  dishName: string,
  price: number,
  appUrl: string
): string {
  return `🍱 Hôm nay hệ thống tự đặt cho bạn: ${dishName} x1 — ${price.toLocaleString("vi-VN")}đ.\nMuốn đổi hoặc hủy, vào đây trước khi admin chốt sổ: ${appUrl}`
}

// build-menu-updated-message.ts
export function buildMenuUpdatedMessage(
  date: Date,
  items: { name: string; price: number; sideDishes: string | null }[],
  appUrl: string
): string {
  const weekday = formatInTimeZone(date, "Asia/Ho_Chi_Minh", "EEEE", { locale: vi })
  const dateStr = formatInTimeZone(date, "Asia/Ho_Chi_Minh", "dd/MM/yyyy")
  const itemLines = items
    .map(i => {
      const sides = i.sideDishes ? ` (${i.sideDishes})` : ""
      return `• ${i.name} — ${i.price.toLocaleString("vi-VN")}đ${sides}`
    })
    .join("\n")
  return `✏️ Admin vừa cập nhật thực đơn hôm nay (${weekday}, ${dateStr}):\n\n${itemLines}\n\n👉 Xem và đặt cơm tại đây: ${appUrl}`
}

// build-external-dishes-updated-message.ts
export function buildExternalDishesUpdatedMessage(
  dishes: { name: string; orderUrl: string }[]
): string {
  const lines = dishes.map(d => `• ${d.name} — ${d.orderUrl}`).join("\n")
  return `🛵 Admin vừa cập nhật món ăn ngoài cho hôm nay:\n\n${lines}`
}

// build-menu-locked-message.ts
export function buildMenuLockedMessage(): string {
  return `🔒 Admin đã chốt danh sách đặt cơm hôm nay. Đơn đã được gửi đi rồi!\nNếu bạn chưa đặt, vui lòng tự lo bữa trưa nhé! 🍜`
}

// build-balance-reminder-message.ts
export function buildBalanceReminderMessage(count: number, appUrl: string): string {
  return `💰 ${count} người đang có số dư âm. Vào đây để nạp tiền: ${appUrl}`
}

// did-items-change.ts — helper used in PATCH /api/menu/[id]/items
export function didItemsChange(
  before: { name: string; price: number; sideDishes: string | null }[],
  after: { name: string; price: number; sideDishes: string | null }[]
): boolean {
  const toKey = (i: { name: string; price: number; sideDishes: string | null }) =>
    `${i.name}|${i.price}|${i.sideDishes ?? ""}`
  const beforeKeys = new Set(before.map(toKey))
  const afterKeys = new Set(after.map(toKey))
  if (beforeKeys.size !== afterKeys.size) return true
  for (const k of afterKeys) if (!beforeKeys.has(k)) return true
  return false
}
```

---

## User Stories

- [ ] US1: Channel receives today's menu when admin publishes
- [ ] US2: Each eligible auto-order employee receives a DM with their dish and a link
- [ ] US3: Employees without a `slackId` do not receive DMs
- [ ] US4: Channel receives an updated menu notification when admin saves post-publish item changes
- [ ] US5: No menu-updated notification is sent if the saved items are identical to what was already in the DB
- [ ] US6: Channel receives an external dishes notification when admin adds/removes an external dish post-publish and the resulting list is non-empty
- [ ] US7: No external dishes notification is sent when admin removes the last external dish (list becomes empty)
- [ ] US8: Channel receives a locked notification when admin clicks "Chốt sổ"
- [ ] US9: Channel receives balance reminder at 13:00 on weekdays when employees with negative balance exist
- [ ] US10: No reminder is sent if today has no published menu
- [ ] US11: No reminder is sent if all employees have non-negative balance
- [ ] US12: Slack failures in any of these flows do not cause the triggering operation to fail

---

## Environment Variables Required

```env
SLACK_BOT_TOKEN="xoxb-..."          # scope: chat:write (for DMs)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."  # for channel posts
NEXT_PUBLIC_APP_URL="https://datcom.company.com"
CRON_SECRET="random-secret-string"
```

---

## Notes

- **Slack bot scopes required:** `chat:write` only — no additional scopes needed
- **DM to a user:** `chat.postMessage` with `channel = slackId` (Slack member ID) sends a DM directly; the bot must be in no shared channel for this to work — Slack allows DMs from bots without shared channels as long as `chat:write` scope is granted
- **Weekday format** — use `date-fns/locale/vi` for Vietnamese weekday names (Thứ Hai, Thứ Ba, etc.)
- **`Promise.allSettled`** — always use for fan-out DM sending; one failed DM must not block others
- **Cron only on weekdays** — `1-5` in cron expression covers Monday–Friday; no reminder on weekends
- **Cron checks menu first** — if today has no published menu, skip the balance check entirely (no point reminding on days the office isn't ordering)