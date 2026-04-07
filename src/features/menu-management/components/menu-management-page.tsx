'use client';

import { useEffect } from 'react';

import { useMenuSuggestions } from '../hooks/use-menu-suggestions';
import { useTodayMenu } from '../hooks/use-today-menu';
import { useMenuDraftStore } from '../stores/menu-draft.store';

import { MenuExternalSection } from './menu-external-section';
import { MenuHeader } from './menu-header';
import { MenuKitchenSummary } from './menu-kitchen-summary';
import { MenuTable, MenuTableReadonly } from './menu-table';

// Use a fixed date reference for the header display — won't change during session
const PAGE_DATE = new Date();

let tempIdCounter = 0;

export function MenuManagementPage() {
  const { data, isLoading, isError } = useTodayMenu();
  useMenuSuggestions();
  const setItems = useMenuDraftStore((s) => s.setItems);
  const reset = useMenuDraftStore((s) => s.reset);

  // Initialize draft store from API data
  useEffect(() => {
    if (!data) return;

    if (data.status === 'prefill') {
      // Pre-publish: start with empty table (per SPEC: no prefill from previous day)
      reset();
    } else if (data.status === 'exists' && !data.menu.isLocked) {
      // Published but not locked: populate store from DB items
      setItems(
        data.menu.items.map((item) => ({
          tempId: `db-${item.id}-${++tempIdCounter}`,
          name: item.name,
          price: item.price,
          sideDishes: item.sideDishes ?? '',
        }))
      );
    }
  }, [data?.status, data?.status === 'exists' ? data.menu.id : null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <p className="text-muted-foreground py-12 text-center text-sm">Đang tải thực đơn...</p>;
  }

  if (isError || !data) {
    return <p className="py-12 text-center text-sm text-red-500">Không thể tải thực đơn hôm nay.</p>;
  }

  if (data.status === 'prefill') {
    return (
      <div>
        <MenuHeader status="prefill" menu={null} date={PAGE_DATE} />
        <MenuTable />
        <MenuExternalSection mode="prefill" />
      </div>
    );
  }

  const { menu } = data;
  const status = menu.isLocked ? 'locked' : 'published';

  return (
    <div>
      <MenuHeader status={status} menu={menu} date={new Date(menu.date)} />
      {menu.isLocked ? <MenuTableReadonly items={menu.items} /> : <MenuTable />}
      <MenuExternalSection
        mode="published"
        menuId={menu.id}
        externalDishes={menu.externalDishes}
        isLocked={menu.isLocked}
      />
      {menu.isLocked && menu.items.length > 0 && <MenuKitchenSummary />}
    </div>
  );
}
