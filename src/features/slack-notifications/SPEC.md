# SPEC: Slack Notifications (F7)

> Event-driven and scheduled Slack messages.
> Domain knowledge → `docs/domains/order.md`, `docs/domains/menu.md`, `docs/domains/employee.md`.
> No UI — this feature is purely server-side logic.

---

## Overview

Two types of Slack messages:

| Type | Trigger | Target |
|---|---|---|
| Menu published | Admin clicks "Đăng thực đơn" | Channel |
| Auto order created | Part of publish flow | Employee DM (per eligible employee) |
| Payment reminder | Vercel Cron at 13:00 weekdays | Channel |

All Slack logic lives in `shared/lib/slack.ts`. This feature wires up the helpers into the publish and cron flows.

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

### 3. Payment Reminder — Channel Post

Sent to the Slack channel via Incoming Webhook at 13:00 every weekday.

```
💰 {count} người chưa trả tiền cơm hôm nay. Trả tại: {NEXT_PUBLIC_APP_URL}
```

Only sent when:
- A published menu exists for today
- At least one employee has unpaid orders for today (`count > 0`)

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

// 3. Count employees with unpaid orders today
const unpaidEmployees = await prisma.order.findMany({
  where: { menuOfDayId: menu.id, isPaid: false },
  select: { employeeId: true },
  distinct: ["employeeId"],
})
if (unpaidEmployees.length === 0) {
  return NextResponse.json({ ok: true, skipped: "everyone paid" })
}

// 4. Post reminder
await postChannel(
  `💰 ${unpaidEmployees.length} người chưa trả tiền cơm hôm nay. Trả tại: ${env.NEXT_PUBLIC_APP_URL}`
)

return NextResponse.json({ ok: true, reminded: unpaidEmployees.length })
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
```

---

## User Stories

- [ ] US1: Channel receives today's menu when admin publishes
- [ ] US2: Each eligible auto-order employee receives a DM with their dish and a link
- [ ] US3: Employees without a `slackId` do not receive DMs
- [ ] US4: Channel receives payment reminder at 13:00 on weekdays when unpaid orders exist
- [ ] US5: No reminder is sent if today has no published menu
- [ ] US6: No reminder is sent if all orders are paid
- [ ] US7: Slack failures during publish do not cause the publish to fail

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