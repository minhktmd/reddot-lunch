# SPEC: App Settings (F4)

> Admin page for managing global app configuration.
> Route: `/admin/settings`

---

## Overview

Admin configures the office bank account used for lunch fund top-ups.
`AppConfig` is a singleton row in the DB (`id = "singleton"`). This page reads and writes that row.

The bank account info is used to generate dynamic VietQR codes on the Finance tab —
no static image upload or file storage needed.

---

## Screen

### Bank Account Section

**State A — Not configured yet:**

```
Chưa có thông tin tài khoản ngân hàng.
Cấu hình để thành viên có thể quét mã QR nạp tiền.
[Cài đặt ngay]
```

**State B — Configured:**

```
Tài khoản nhận tiền
─────────────────────────────────────
Ngân hàng:        MB Bank
Số tài khoản:     1234567890
Chủ tài khoản:    VU NGOC ANH

[QR preview — 200×200px — placeholder amount 10.000đ]

Cập nhật: 12/03/2026 lúc 09:15

[Chỉnh sửa]
─────────────────────────────────────
```

- QR preview uses a placeholder amount of `10000` so admin can scan to verify it works
- Clicking [Chỉnh sửa] reveals the edit form inline (same card, no page navigation)

**Edit / Setup form:**

```
Ngân hàng *
[dropdown — searchable list of Vietnamese banks from VietQR]

Số tài khoản *
[___________________]

Tên chủ tài khoản *
[___________________]
(Nhập IN HOA không dấu, ví dụ: VU NGOC ANH)

[Lưu]  [Hủy]
```

**Save flow:**
1. Validate: all 3 fields required, `bankAccount` non-empty string
2. `POST /api/config/bank` with `{ bankCode, bankAccount, bankAccountName }`
3. Server upserts `AppConfig` row (`where: { id: "singleton" }`)
4. UI shows updated info + refreshed QR preview
5. Toast: `"Đã lưu thông tin tài khoản"`

---

## Bank List

Fetch from VietQR public API: `GET https://api.vietqr.io/v2/banks`

- Fetch once on page load, cache in component state
- Display as a searchable dropdown: `"MB — Ngân hàng Quân đội"`
- Store the `bin` field (numeric BIN code) as the value — this is what the VietQR image URL requires
- If the API call fails, fall back to a hardcoded list of the top 10 most common Vietnamese banks

**VietQR image URL format:**

```
https://img.vietqr.io/image/{bin}-{bankAccount}-compact2.png
  ?amount={amount}
  &addInfo={encodeURIComponent(addInfo)}
  &accountName={encodeURIComponent(bankAccountName)}
```

Example with placeholder:

```
https://img.vietqr.io/image/970422-1234567890-compact2.png
  ?amount=10000
  &addInfo=preview
  &accountName=HOANG%20DO
```

---

## User Stories

- [ ] US1: Admin sees "not configured" message when no bank account has been set up
- [ ] US2: Admin can configure bank (from searchable dropdown), account number, and account name
- [ ] US3: Admin sees a QR code preview after saving — can scan to verify it works correctly
- [ ] US4: Admin can update the bank account info at any time
- [ ] US5: QR preview updates immediately after saving without page reload

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load config | GET | `/api/config` | — |
| Save bank info | POST | `/api/config/bank` | `{ bankCode, bankAccount, bankAccountName }` |
| Load bank list | GET | `https://api.vietqr.io/v2/banks` | — (external, client-side only) |

### GET /api/config response shape

```ts
type AppConfigResponse = {
  bankCode: string | null        // VietQR BIN code, e.g. "970422"
  bankAccount: string | null
  bankAccountName: string | null
  updatedAt: string              // ISO datetime string
}
```

### POST /api/config/bank

Request body:

```ts
type SaveBankConfigInput = {
  bankCode: string        // BIN code from VietQR bank list
  bankAccount: string
  bankAccountName: string // ALL CAPS, no diacritics
}
```

- Validates all 3 fields are non-empty strings
- Upserts `AppConfig` with `where: { id: "singleton" }`
- Returns updated `AppConfigResponse`

---

## VietQR Utility (client-side)

Lives in `src/shared/utils/viet-qr.ts`. Used by both F4 (preview) and F6 (top-up form).

```ts
type VietQRParams = {
  bankCode: string        // BIN code
  bankAccount: string
  bankAccountName: string
  amount: number          // VND, positive integer
  addInfo: string         // transfer description — diacritics already removed by caller
}

export function buildVietQRUrl(params: VietQRParams): string {
  const { bankCode, bankAccount, bankAccountName, amount, addInfo } = params
  const base = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png`
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: bankAccountName,
  })
  return `${base}?${query.toString()}`
}
```

### Diacritics removal utility

Lives in `src/shared/utils/text.ts`. Used to sanitize employee names before building `addInfo`.

```ts
export function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}
```

`addInfo` format: `RDL - {removeDiacritics(employeeName)} chuyen tien an trua`

Example: `"Hoàng Đỗ"` → `"RDL - Vu Ngoc Anh chuyen tien an trua"`

---

## Component Structure

```
features/app-settings/
├── components/
│   ├── settings-bank-section.tsx    — Bank info display + edit toggle
│   ├── settings-bank-form.tsx       — Bank dropdown (searchable) + account fields + save button
│   └── settings-qr-preview.tsx      — <img src={vietQRUrl}> with placeholder amount 10000
├── hooks/
│   ├── use-app-config.ts            — GET /api/config
│   ├── use-save-bank-config.ts      — POST /api/config/bank (mutation)
│   └── use-bank-list.ts             — GET https://api.vietqr.io/v2/banks with hardcoded fallback
└── index.ts
```

---

## Notes

- **`bankCode` stores the BIN** (e.g. `"970422"` for MB), not the short name — BIN is what VietQR URL requires
- **`bankAccountName` in ALL CAPS, no diacritics** — show helper text in the form field; this is what appears printed on the QR scan result
- **No file storage** — QR is a plain `<img src={url}>` tag; VietQR CDN renders the image; no Vercel Blob or server involvement
- **Bank list is external** — fetched from `https://api.vietqr.io/v2/banks`; if unavailable, fall back to hardcoded top-10 list
- **Preview amount** — always `10000` (10.000đ) in the admin preview so the QR is scannable but not a real transaction amount
- **Extensible** — page can gain more settings sections over time (e.g. cron schedule, app name); bank account is the first section only