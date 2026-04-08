# SPEC: App Settings (F4)

> Admin page for managing global app configuration.
> Route: `/admin/settings`

---

## Overview

Single-purpose page — admin uploads or replaces the QR code image used for payment.
`AppConfig` is a singleton row in the DB (`id = "singleton"`). This page reads and writes that row.

---

## Screen

### QR Code Section

**State A — No QR code uploaded yet:**

```
Chưa có mã QR.
[Tải ảnh lên]
```

**State B — QR code exists:**

```
Mã QR thanh toán
─────────────────────────────────────
[QR image preview — 200×200px]

Cập nhật: 12/03/2026 lúc 09:15

[Tải ảnh mới lên]
─────────────────────────────────────
```

- Show current QR image from `AppConfig.qrCodeUrl`
- Show last updated timestamp from `AppConfig.updatedAt`
- "Tải ảnh mới lên" button → opens file picker

**Upload flow:**

1. Admin clicks button → file picker opens (`accept: image/png, image/jpeg, image/webp`)
2. Admin selects image → client-side preview shown immediately via `URL.createObjectURL`
3. "Xác nhận tải lên" button appears below preview
4. Admin confirms → `POST /api/config/qr` with `FormData` containing the image file
5. Server uploads to Vercel Blob at `payment-qr` (overwrites existing)
6. Server upserts `AppConfig.qrCodeUrl` with the new public URL
7. UI shows new image + updated timestamp

---

## User Stories

- [ ] US1: Admin sees current QR code image and last updated time
- [ ] US2: Admin sees "no QR code" message when none has been uploaded
- [ ] US3: Admin can upload a new QR code image (PNG, JPEG, or WebP)
- [ ] US4: Admin sees a preview of the selected image before confirming upload
- [ ] US5: After upload, the new QR code image is shown immediately

---

## API Calls

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Load config | GET | `/api/config` | — |
| Upload QR image | POST | `/api/config/qr` | `FormData` with `file` field |

### GET /api/config response shape

```ts
type AppConfigResponse = {
  qrCodeUrl: string | null
  updatedAt: string  // ISO string
}
```

### POST /api/config/qr

- Accepts `multipart/form-data` with a single `file` field
- Server: upload to Vercel Blob → upsert `AppConfig.qrCodeUrl`
- Max file size: 2MB — reject with `400` if exceeded
- Returns updated `AppConfigResponse`

---

## Component Structure

```
features/app-settings/
├── components/
│   ├── settings-qr-section.tsx     — QR code display + upload flow
│   └── settings-qr-upload.tsx      — File picker + preview + confirm button
├── hooks/
│   ├── use-app-config.ts           — GET /api/config
│   └── use-upload-qr.ts            — POST /api/config/qr
└── index.ts
```

---

## Notes

- **Overwrite, not versioned** — each upload replaces `qr-codes/payment-qr.png`; no history kept
- **Cache busting** — after upload, append `?t={Date.now()}` to the URL to prevent browser caching the old image
- **Vercel Blob helper** — upload logic in `shared/lib/blob.ts` as `uploadQRCode(file: File): Promise<string>`
- **No other settings for now** — page can be extended later; currently only manages the QR code