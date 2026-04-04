# Feature: [Feature Name]

<!--
  PURPOSE: The source of truth for this feature's implementation.
  Claude Code reads this before writing any code for this feature.
  Keep it updated as requirements evolve — it should always reflect current intent.

  READING ORDER (before implementing):
  1. docs/BRIEF.md         — original business intent
  2. docs/OVERVIEW.md      — domain model + feature map
  3. docs/domains/<x>.md   — domain knowledge relevant to this feature
  4. This file             — feature-specific detail

  WHAT TO ADD:
  - Overview: what the feature does in 2–3 sentences
  - User Stories: what users need to accomplish (US-n format, track with [ ] / [x])
  - Screens: each screen/page, URL, UI elements, user interactions, and outcomes
  - API Contracts: every endpoint this feature calls — request + response shapes
  - Business Rules: constraints, validations, edge cases not obvious from the UI
  - Implementation Notes: optional hints for the implementer (avoid over-specifying)

  WHAT NOT TO ADD:
  - Component code or implementation details
  - Styles or layout preferences (describe behavior, not appearance)
  - Rules that apply across features (those go in docs/OVERVIEW.md or domain docs)
-->

## Overview

<!--
  2–3 sentences: what problem this feature solves, who uses it, and the happy path.

  Example:
  Allows authenticated users to deposit funds into a selected vault.
  The user selects a vault, enters an amount, confirms the transaction, and receives
  a success toast once the deposit is recorded on-chain.
-->

[Describe the feature]

---

## User Stories

<!--
  Format: US-n: As a [role], I can [action] [so that optional context]
  Check off each story as you implement it — update [ ] → [x].

  Example:
  - [ ] US-1: As a member, I can view a list of available vaults
  - [ ] US-2: As a member, I can deposit funds into a vault I select
  - [ ] US-3: As a member, I see inline validation errors before submitting
  - [ ] US-4: As a member, I see a success toast after a deposit is confirmed
-->

- [ ] US-1: As a [role], I can [action]
- [ ] US-2: As a [role], I can [action]
- [ ] US-3: As a [role], I can [action]

---

## Screens

<!--
  One subsection per screen or major UI state.
  For each screen: URL, what's visible, interactions, and what happens as a result.
  Reference user stories where relevant (e.g. "satisfies US-1").

  Example:

  ### Vault List (`/vaults`)
  - Displays a grid of VaultCard components — one per active vault
  - Each card shows: name, APY, status badge, and a "Deposit" CTA button
  - Loading state: skeleton cards (3 placeholders)
  - Empty state: "No vaults available" message
  - On "Deposit" click → navigate to /vaults/[id]/deposit

  ### Deposit (`/vaults/[id]/deposit`)
  - Amount input (required, numeric, min 0.01)
  - "Confirm" button — disabled while pending
  - On success → toast "Deposit confirmed" + redirect to /vaults
  - On error → toast with server error message
-->

### [Screen Name] (`/route`)

<!--
  - [UI element]: [description]
  - On [action] → [outcome]
  - Loading state: [description]
  - Error state: [description]
  - Empty state: [description]
-->

---

## API Contracts

<!--
  One subsection per endpoint. Include method, path, request body, and response shapes.
  Use JSON examples — no need for formal OpenAPI here.

  Example:

  ### GET `/vaults`
  **Response 200:**
  ```json
  {
    "data": [
      { "id": "...", "name": "Alpha Vault", "apy": 12.5, "status": "active" }
    ]
  }
  ```

  ### POST `/vaults/:id/deposit`
  **Request:**
  ```json
  { "amount": 100.00 }
  ```
  **Response 201:**
  ```json
  { "depositId": "...", "vaultId": "...", "amount": 100.00, "createdAt": "..." }
  ```
  **Response 400:**
  ```json
  { "message": "Insufficient balance" }
  ```
-->

### [METHOD] `/endpoint`

**Request:**

```json
{}
```

**Response [status]:**

```json
{}
```

---

## Business Rules

<!--
  Constraints and edge cases that are not obvious from the UI description.
  Anything the implementer might get wrong without being told explicitly.

  Example:
  - Minimum deposit amount is $0.01 — enforced by both Zod schema and server
  - A vault with status "closed" cannot accept new deposits — show a disabled state
  - Amount field accepts up to 2 decimal places — round at the UI layer before submitting
  - After a successful deposit, invalidate queryKeys.vaults.all and queryKeys.deposits.all
-->

- [Rule 1]
- [Rule 2]
- [Rule 3]

---

## Implementation Notes

<!--
  Optional hints for the implementer — edge cases, gotchas, or component suggestions.
  Do not over-specify here; trust the implementer to make good decisions within these bounds.

  Example:
  - Reuse `VaultCard` from domains/vault/components if it already exists
  - The deposit form should use the `form-pattern` skill
  - Use `useReducer` for the multi-step confirmation flow (select → confirm → done)
-->

- [Hint or note]
