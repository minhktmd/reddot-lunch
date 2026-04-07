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
  const externalDishes = useMenuDraftStore((s) => s.externalDishes);

  const handleClick = () => {
    const validItems = items.filter((i) => i.name.trim() && i.price > 0);
    const hasValidItems = validItems.length > 0;
    const hasExternalDishes = externalDishes.length > 0;

    if (!hasValidItems && !hasExternalDishes) {
      toast.error('Thêm ít nhất một món ăn hoặc một món ăn ngoài trước khi đăng');
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
        externalDishes: externalDishes.map((d) => ({
          name: d.name,
          orderUrl: d.orderUrl,
        })),
      },
      { onSettled: () => setConfirming(false) }
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
