# BRIEF.md

> Raw requirements from project owner — do not edit. This is the source of truth for original business intent.
> All interpretation and structure belongs in OVERVIEW.md and domain docs.

---

## What is this app?

A web app for managing daily lunch orders in an office of ~30–50 people. Replaces an existing Google Sheets workflow. No authentication — users identify themselves by selecting their name from a list.

---

## Why replace Google Sheets?

| Google Sheets problem | Web app solution |
|---|---|
| Concurrent edits on the same cell → conflicts | Each person submits their own order independently |
| No automatic aggregation | Real-time summary for admin |
| No reminders | Slack bot for order and payment reminders |
| No monthly history | Full DB records with monthly reports |

---

## Who uses this?

- **Employees (~30–50 people):** place their own lunch order each day, pay via bank transfer
- **Admin (1–few people):** create the daily menu, publish it, lock orders, track payment

No login system. Everyone accesses the app via URL. Admin pages are under `/admin` but have no password.

---

## What does an employee do?

1. First visit: select their name from a dropdown → saved to browser (localStorage)
2. Each day: go to the app → see today's menu → pick a dish → submit
3. Pay via bank transfer (QR code shown in the app)
4. Can toggle "auto order" → system orders a random dish for them automatically when admin publishes the menu

One employee can order multiple dishes on the same day (different meal types).

---

## What does admin do?

**Daily:**
1. Create today's menu — pick dishes from a catalog, set price and side dishes for each
2. Can clone the most recent previous menu instead of creating from scratch
3. Publish the menu → Slack notification fires to the channel, auto orders are created
4. When ready to send to kitchen → Lock orders → copy the aggregated list
5. Can Unlock if changes are needed

**Ongoing:**
- Upload/replace the QR code image used for payment
- Manage the employee list (add, edit, soft-delete)
- Manage the dish catalog (MenuItem)
- View monthly reports, export CSV

---

## Payment flow

- No payment processing — employees transfer money via bank using a QR code
- Employee sees all their unpaid orders across history → selects which ones to pay → clicks "Confirm Payment"
- System marks selected orders as paid
- Admin can see payment status on the dashboard
- Admin can undo payment if needed

---

## Auto order

- Employee can toggle auto order on/off on the home page
- When admin publishes the menu: if employee has auto order ON and no existing order for today → system creates one order with a random dish
- Employee gets a Slack DM with what was ordered and a link to change/cancel
- Employee can edit or cancel the auto order like any normal order (as long as orders aren't locked)

---

## Slack integration

Two types of messages:

**Channel posts:**
- When admin publishes the menu: post today's dishes + prices + order link
- Every day at 13:00: remind how many people haven't paid yet + payment link

**Direct messages:**
- When auto order is created: DM the employee with dish name, price, and a link to change/cancel

Admin employees (role = "admin") receive admin-targeted notifications if they have a Slack ID configured.

---

## Infrastructure constraints

Everything must run on free tier:
- **Vercel** — hosting + cron jobs
- **Prisma Postgres** — PostgreSQL database (via Prisma Accelerate)
- **Vercel Blob** — file storage for QR code image
- **Slack** — Incoming Webhook (channel posts) + Bot API (DMs)

---

## Key constraints and decisions

- No authentication of any kind — all routes are public
- No separate Payment entity — payment state is `isPaid` + `paidAt` directly on each Order
- One QR code image for the whole app, stored in Vercel Blob, replaced on upload
- `AppConfig` is a singleton row in the DB (id = "singleton")
- Timezone: Asia/Ho_Chi_Minh (UTC+7) — all "today" logic must respect this
- All code and file names in English; all UI strings shown to users in Vietnamese
- Mobile-first — employees order from their phones
- Target: ≤ 3 steps to place an order (select name → select dish → submit)