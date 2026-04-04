---
name: const-map-pattern
description: Use when creating a const map, derived type, or options array for dropdowns, filters, badges, or any selectable value set. Never use TypeScript enum — always use this pattern instead.
---

## Rules

- Never use TypeScript `enum` — use `as const` object instead
- Always collocate all three pieces (const map, derived type, options array) in the same `[resource].type.ts` file
- Never split them across files

## Boilerplate

```ts
// 1. Const map — SCREAMING_SNAKE_CASE
export const <RESOURCE>_<CONCEPT> = {
  <KEY>: '<VALUE>',
} as const

// 2. Derived type — PascalCase
export type <Resource><Concept> = (typeof <RESOURCE>_<CONCEPT>)[keyof typeof <RESOURCE>_<CONCEPT>]

// 3. Options array for UI — camelCase, Options suffix
export const <resource><Concept>Options = [
  { label: '<Label>', value: <RESOURCE>_<CONCEPT>.<KEY> },
] as const
```

## Concrete example

```ts
// 1. Const map
export const USER_ROLE = { ADMIN: 'ADMIN', VIEWER: 'VIEWER' } as const;

// 2. Derived type
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// 3. Options array for UI
export const userRoleOptions = [
  { label: 'Admin', value: USER_ROLE.ADMIN },
  { label: 'Viewer', value: USER_ROLE.VIEWER },
] as const;
```

## Naming rules

| Piece         | Convention                    | Example                                       |
| ------------- | ----------------------------- | --------------------------------------------- |
| Const map     | `SCREAMING_SNAKE_CASE`        | `USER_ROLE`, `TRANSACTION_STATUS`             |
| Derived type  | `PascalCase`                  | `UserRole`, `TransactionStatus`               |
| Options array | `camelCase`, `Options` suffix | `userRoleOptions`, `transactionStatusOptions` |

## Where to place

- App-wide maps → `shared/constants/`
- Domain-wide maps → `domains/<domain>/types/`
- Feature-specific maps → `features/<feature>/types/`
