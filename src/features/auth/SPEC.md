# Feature: Auth

## Overview

Handles user authentication — login and logout flows.

---

## User Stories

- [ ] US-1: As a user, I can log in with email and password
- [ ] US-2: As a user, I can log out and be redirected to the login page
- [ ] US-3: As a user, I see inline field errors when I submit invalid input
- [ ] US-4: As a user, I see a toast error when my credentials are incorrect

---

## Screens

### Login (`/login`)

- Email field (required, valid email)
- Password field (required, min 8 characters)
- Submit button — shows loading state while pending
- On success → redirect to `/`
- On error → Sonner toast with server error message

---

## API Contracts

### POST `/auth/login`

**Request:**

```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response 200:**

```json
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "email": "...", "name": "...", "avatarUrl": null, "role": "member", "createdAt": "..." }
}
```

**Response 401:**

```json
{ "message": "Invalid credentials" }
```

### POST `/auth/logout`

**Response 204:** No content

---

## Business Rules

- Access token stored in Zustand store (in-memory only — no localStorage)
- On logout: clear store + invalidate all queries
- Protected routes redirect unauthenticated users to `/login`
