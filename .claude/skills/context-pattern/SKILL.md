---
name: context-pattern
description: Use when creating a new React context — either a global provider in shared/providers/ or a feature-scoped context file. Provides boilerplate and rules for the context pattern used in this project.
---

## When to use

- **Global context** → `shared/providers/<n>-provider.tsx`
- **Feature-scoped context** → `features/<feature>/<feature>-context.tsx`

Only create a feature context when sharing state across multiple deeply nested components. Prefer prop passing for 1-2 levels.

## Rules

- Always initialize context with `null` — never `{} as T` or a fake default value
- Always throw a descriptive error in the consumer hook when context is `null`
- Never call `useContext` directly outside of the dedicated consumer hook
- Co-locate context object, provider, and consumer hook in one file — never split them
- Add `'use client'` at the top — contexts always run on the client

## Boilerplate

```ts
// shared/providers/<n>-provider.tsx  (global)
// features/<feature>/<feature>-context.tsx  (feature-scoped)
'use client'
import { createContext, useContext, useState } from 'react'

interface <N>ContextValue {
  // state and actions
}

const <N>Context = createContext<<N>ContextValue | null>(null)

export function <N>Provider({ children }: { children: React.ReactNode }) {
  // state here
  return (
    <<N>Context.Provider value={{ /* ... */ }}>
      {children}
    </<N>Context.Provider>
  )
}

export function use<N>() {
  const ctx = useContext(<N>Context)
  if (!ctx) throw new Error('use<N> must be used within <N>Provider')
  return ctx
}
```

## Concrete example

```ts
'use client'
import { createContext, useContext, useState } from 'react'

interface ModalContextValue { isOpen: boolean; toggle: () => void }
const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(prev => !prev)
  return (
    <ModalContext.Provider value={{ isOpen, toggle }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
```

## Wiring up a global provider

Add to `shared/providers/index.tsx`:

```ts
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
```
