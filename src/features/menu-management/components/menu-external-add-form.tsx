'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';
import { Input } from '@/shared/components/atoms/input';

type MenuExternalAddFormProps = {
  onAdd: (name: string, orderUrl: string) => void;
  isLoading: boolean;
};

export function MenuExternalAddForm({ onAdd, isLoading }: MenuExternalAddFormProps) {
  const [name, setName] = useState('');
  const [orderUrl, setOrderUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedUrl = orderUrl.trim();

    if (!trimmedName || !trimmedUrl) return;

    try {
      new URL(trimmedUrl);
    } catch {
      setUrlError('URL không hợp lệ');
      return;
    }

    setUrlError('');
    onAdd(trimmedName, trimmedUrl);
    setName('');
    setOrderUrl('');
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Input placeholder="Tên món" value={name} onChange={(e) => setName(e.target.value)} className="sm:w-48" />
      <div className="flex-1">
        <Input
          placeholder="Link đặt"
          value={orderUrl}
          onChange={(e) => {
            setOrderUrl(e.target.value);
            if (urlError) setUrlError('');
          }}
        />
        {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}
      </div>
      <Button size="sm" onClick={handleSubmit} disabled={isLoading || !name.trim() || !orderUrl.trim()}>
        Thêm
      </Button>
    </div>
  );
}
