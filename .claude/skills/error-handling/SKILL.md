---
name: error-handling
description: Use when implementing error boundaries, catch blocks, toast notifications, or the logger. Triggers on phrases like "handle error", "error boundary", "show toast", "catch error", "add logging", "fallback UI".
---

## Rules

- **API errors** → `toast.error()` from Sonner — never inject into component state
- **Unexpected errors** → Error Boundary component with fallback UI
- **`catch` blocks** → always call `logger.error()` — never silently swallow, never use bare `console.log`
- **`logger.log`** → debug only, stripped in production — use for dev tracing
- **`logger.warn`** → always visible — use for degraded states, missing optional data
- **`logger.error`** → always visible — use for caught exceptions and failed operations
- If `shared/lib/logger.ts` does not exist yet: fall back to `console.warn` / `console.error`, never `console.log`
- Error Boundary must be a **class component** (React requirement) — wrap it in a functional component for convenience if needed
- Place Error Boundaries at **feature level** — one per major section, not one per component

## Logger boilerplate

```ts
// shared/lib/logger.ts
import { env } from '@/config/env';

const isProd = env.NODE_ENV === 'production';

export const logger = {
  // Debug only — hidden in production
  log: (...args: unknown[]) => {
    if (!isProd) console.log('[debug]', ...args);
  },
  // Always visible
  warn: (...args: unknown[]) => {
    console.warn('[warn]', ...args);
  },
  // Always visible
  error: (...args: unknown[]) => {
    console.error('[error]', ...args);
  },
};
```

## Catch block pattern

```ts
// ✅ Correct — always log, always handle
try {
  await doSomething();
} catch (error) {
  logger.error('doSomething failed', error);
  toast.error(error instanceof Error ? error.message : 'Something went wrong');
}

// ❌ Wrong — silent swallow
try {
  await doSomething();
} catch {
  // nothing
}

// ❌ Wrong — bare console.log
try {
  await doSomething();
} catch (error) {
  console.log(error);
}
```

## Toast pattern (Sonner)

```tsx
// Setup — in shared/providers/index.tsx or app/layout.tsx
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
```

```ts
// Usage — import from sonner directly, no wrapper needed
import { toast } from 'sonner';

// Success
toast.success('Profile updated');

// API error (from catch block)
toast.error(error instanceof Error ? error.message : 'Something went wrong');

// Warning / info
toast.warning('Session expiring soon');
toast.info('Changes saved as draft');

// Promise toast — for async operations with loading state
toast.promise(uploadFile(file), {
  loading: 'Uploading...',
  success: 'File uploaded',
  error: 'Upload failed',
});
```

## Error Boundary boilerplate

```tsx
// shared/components/organisms/ErrorBoundary.tsx
'use client';
import { Component, type ReactNode } from 'react';
import { logger } from '@/shared/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error('ErrorBoundary caught', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-muted-foreground text-sm">{error?.message ?? 'Something went wrong'}</p>
      <button onClick={() => window.location.reload()} className="text-sm underline">
        Reload page
      </button>
    </div>
  );
}
```

## Error Boundary usage

```tsx
// Wrap at feature level — not per-component
// src/app/(dashboard)/vault/page.tsx

import { ErrorBoundary } from '@/shared/components/organisms/ErrorBoundary';
import { VaultList } from '@/features/vault';

export default function VaultPage() {
  return (
    <ErrorBoundary fallback={<p>Failed to load vaults.</p>}>
      <VaultList />
    </ErrorBoundary>
  );
}
```

## Async error in mutation hook

```ts
// features/<feature>/hooks/useCreate<Resource>.ts
export function useCreate<Resource>() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: create<Resource>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.<resource>s.all })
    },
    onError: (error) => {
      // Log here — toast is handled at the call site (form component)
      logger.error('useCreate<Resource> failed', error)
    },
  })
}
```

```tsx
// Call site — form component handles the toast
const handleSubmit = form.handleSubmit(async (values) => {
  try {
    await mutateAsync(values);
    toast.success('<Resource> created');
    form.reset();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Something went wrong');
  }
});
```

## Where to place

- `shared/lib/logger.ts` — logger singleton (create once, import everywhere)
- `shared/components/organisms/ErrorBoundary.tsx` — reusable class component
- Toast calls → at the **call site** (form `handleSubmit`, event handler) — not inside services or mutation hooks
- `logger.error` → both at the **call site** and inside `onError` of mutation hooks
