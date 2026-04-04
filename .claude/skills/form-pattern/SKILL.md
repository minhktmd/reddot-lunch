---
name: form-pattern
description: Use when creating a new form with validation — login, register, settings, create/edit resource, or any user input. Stack is react-hook-form v7 + zod v4 + @hookform/resolvers v5. Triggers on phrases like "create a form", "add validation", "form submit", "controlled input", "field error".
---

## Rules

- Always define Zod schema **first** — types are derived from it, never written manually alongside it
- Always use `z.infer<typeof schema>` — never duplicate types by hand
- Always pass `zodResolver(schema)` to `useForm` — never write custom validation logic
- **Field errors** → render inline below each field via `formState.errors`
- **Submit errors** (API failures) → display via Sonner `toast.error()` — never inject into form state
- Always call `form.reset()` after a successful mutation
- Always disable the submit button while `formState.isSubmitting` is true
- Never use `register` for complex inputs (select, checkbox, date) — use `Controller` instead
- `'use client'` required at the top of every form component file

## Stack versions

```
react-hook-form    v7
zod                v4
@hookform/resolvers v5   ← CRITICAL: v4 is incompatible with Zod v4 (errors silently empty)
```

## Boilerplate — simple form

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreate<Resource> } from '../hooks/useCreate<Resource>'

// 1. Schema first
const <resource>Schema = z.object({
  field: z.string().min(1, 'Field is required'),
})

// 2. Derive type — never write manually
type <Resource>FormValues = z.infer<typeof <resource>Schema>

export function <Resource>Form() {
  const { mutateAsync, isPending } = useCreate<Resource>()

  const form = useForm<<Resource>FormValues>({
    resolver: zodResolver(<resource>Schema),
    defaultValues: { field: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync(values)
      form.reset()
      toast.success('<Resource> created successfully')
    } catch (error) {
      // API errors → toast, never injected into form state
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="field">Field</label>
        <input id="field" {...form.register('field')} />
        {form.formState.errors.field && (
          <p className="text-sm text-destructive">{form.formState.errors.field.message}</p>
        )}
      </div>

      <button type="submit" disabled={form.formState.isSubmitting || isPending}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## Boilerplate — edit form (pre-populated)

```tsx
'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUpdate<Resource> } from '../hooks/useUpdate<Resource>'
import type { <Resource> } from '../types/<resource>.type'

const <resource>Schema = z.object({
  field: z.string().min(1, 'Field is required'),
})

type <Resource>FormValues = z.infer<typeof <resource>Schema>

interface <Resource>FormProps {
  initial: <Resource>
}

export function <Resource>Form({ initial }: <Resource>FormProps) {
  const { mutateAsync, isPending } = useUpdate<Resource>()

  const form = useForm<<Resource>FormValues>({
    resolver: zodResolver(<resource>Schema),
    defaultValues: { field: initial.field },
  })

  // Sync form when initial data changes (e.g. after refetch)
  useEffect(() => {
    form.reset({ field: initial.field })
  }, [initial, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ id: initial.id, ...values })
      toast.success('Changes saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="field">Field</label>
        <input id="field" {...form.register('field')} />
        {form.formState.errors.field && (
          <p className="text-sm text-destructive">{form.formState.errors.field.message}</p>
        )}
      </div>

      <button type="submit" disabled={form.formState.isSubmitting || isPending}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
```

## Controller pattern — for complex inputs

Use `Controller` when `register` is not enough: shadcn Select, Checkbox, DatePicker, custom inputs.

```tsx
import { Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

// Inside the form component:
<Controller
  control={form.control}
  name="status"
  render={({ field }) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  )}
/>;
{
  form.formState.errors.status && <p className="text-destructive text-sm">{form.formState.errors.status.message}</p>;
}
```

## Common Zod patterns

```ts
const schema = z
  .object({
    // Required string
    name: z.string().min(1, 'Name is required'),

    // Optional string
    description: z.string().optional(),

    // Email
    email: z.string().email('Invalid email address'),

    // Number from input (inputs return strings — coerce)
    amount: z.coerce.number().positive('Must be positive'),

    // Enum from const map
    status: z.enum(['active', 'inactive']),

    // Confirmed password
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
```

## Where to place

- Schema + derived type → `features/<feature>/types/<resource>.type.ts` (co-located with other types)
- Form component → `features/<feature>/components/<Resource>Form.tsx`
- If a feature has 3+ schemas → extract to `features/<feature>/schemas/<resource>.schema.ts`
