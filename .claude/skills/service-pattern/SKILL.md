---
name: service-pattern
description: Use when creating a new service function, TanStack Query hook, or mutation. Provides Axios instance boilerplate, safeParse pattern, query key factory, and query/mutation hooks.
---

## Where to place

- `shared/services/api.ts` — Axios instance (create once, reuse everywhere)
- `features/<feature>/services/<resource>.service.ts` — feature API functions
- `domains/<domain>/services/<resource>.service.ts` — shared domain API functions
- `shared/constants/query-keys.ts` — centralized query key factory

## Rules

- **Client-side:** always use the Axios instance from `shared/services/api.ts` — never raw `axios` or `fetch`
- **Server-side (Next.js only):** use native `fetch` to preserve Next.js cache extensions
- Always use `safeParse()` (Zod v3+), never `.parse()` — handle `result.success` explicitly
- Always use query keys from `shared/constants/query-keys.ts` — never inline string arrays
- Always call `queryClient.invalidateQueries` after mutations
- Service functions are plain async functions — no React hooks inside
- **204 No Content:** handle per-service — do not rely on unwrapped `res.data` for empty responses

---

## Axios instance

```ts
// shared/services/api.ts
import axios from 'axios';
import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token
apiClient.interceptors.request.use((config) => {
  const token = getToken(); // replace with your auth token getter
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap res.data + normalize errors
apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message ?? err.message;
    return Promise.reject(new Error(message));
  }
);
```

---

## Service function pattern

```ts
// features/<feature>/services/<resource>.service.ts
import { apiClient } from '@/shared/services/api'
import { logger } from '@/shared/lib/logger'
import { <resource>Schema } from '../types/<resource>.type'

export async function get<Resource>(): Promise<<Resource>[]> {
  const data = await apiClient.get('/<resource>s')
  const result = <resource>Schema.safeParse(data)
  if (!result.success) {
    logger.error('get<Resource>: validation failed', result.error)
    throw new Error('Invalid response shape from /<resource>s')
  }
  return result.data
}

export async function create<Resource>(payload: Create<Resource>Payload): Promise<<Resource>> {
  const data = await apiClient.post('/<resource>s', payload)
  const result = <resource>Schema.safeParse(data)
  if (!result.success) {
    logger.error('create<Resource>: validation failed', result.error)
    throw new Error('Invalid response shape from POST /<resource>s')
  }
  return result.data
}

// 204 No Content — no data to parse
export async function delete<Resource>(id: string): Promise<void> {
  await apiClient.delete(`/<resource>s/${id}`)
}
```

---

## Query key factory

```ts
// shared/constants/query-keys.ts
export const queryKeys = {
  <resource>s: {
    all: ['<resource>s'] as const,
    detail: (id: string) => ['<resource>s', id] as const,
  },
}
```

---

## Query hook

```ts
// features/<feature>/hooks/useGet<Resource>s.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/constants/query-keys'
import { get<Resource>s } from '../services/<resource>.service'

export function useGet<Resource>s() {
  return useQuery({
    queryKey: queryKeys.<resource>s.all,
    queryFn: get<Resource>s,
  })
}
```

---

## Mutation hook

```ts
// features/<feature>/hooks/useCreate<Resource>.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/constants/query-keys'
import { create<Resource> } from '../services/<resource>.service'

export function useCreate<Resource>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: create<Resource>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.<resource>s.all })
    },
  })
}
```
