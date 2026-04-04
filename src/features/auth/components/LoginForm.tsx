'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/shared/components/atoms/button';
import { FormField } from '@/shared/components/molecules/form-field';

import { useLogin } from '../hooks/useLogin';
import { loginPayloadSchema, type LoginPayload } from '../types/auth.type';

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginPayload>({
    resolver: zodResolver(loginPayloadSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginPayload) => {
    login(values);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
