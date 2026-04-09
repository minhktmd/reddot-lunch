'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/atoms/card';
import { Input } from '@/shared/components/atoms/input';

export function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');

  const hasError = searchParams.get('error') === 'invalid';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    window.location.href = `/admin?token=${encodeURIComponent(trimmed)}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Truy cập trang quản trị</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Nhập token admin"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
            />
            {hasError && <p className="text-destructive text-sm">Token không hợp lệ. Vui lòng thử lại.</p>}
            <Button type="submit" className="w-full">
              Xác nhận
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
