'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/atoms/button';

import { usePublishMenu } from '../hooks/use-publish-menu';
import { useMenuDraftStore } from '../stores/menu-draft.store';

export function MenuPublishButton() {
  const [confirming, setConfirming] = useState(false);
  const { mutate: publish, isPending } = usePublishMenu();
  const items = useMenuDraftStore((s) => s.items);

  const handleClick = () => {
    const validItems = items.filter((i) => i.name.trim() && i.price > 0);
    if (validItems.length === 0) {
      toast.error('Cần ít nhất một món để đăng thực đơn');
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    publish(
      {
        items: validItems.map((item) => ({
          name: item.name.trim(),
          price: item.price,
          sideDishes: item.sideDishes.trim() || undefined,
        })),
      },
      { onSettled: () => setConfirming(false) },
    );
  };

  return (
    <Button
      variant={confirming ? 'destructive' : 'default'}
      onClick={handleClick}
      disabled={isPending}
      onBlur={() => setConfirming(false)}
    >
      {isPending ? 'Đang đăng...' : confirming ? 'Đăng thực đơn và thông báo Slack?' : 'Đăng thực đơn'}
    </Button>
  );
}
