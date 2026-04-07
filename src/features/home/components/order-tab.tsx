'use client';

import { useCancelOrder } from '../hooks/use-cancel-order';
import { useEditOrder } from '../hooks/use-edit-order';
import { usePlaceOrder } from '../hooks/use-place-order';
import { useTodayMenu } from '../hooks/use-today-menu';
import { useTodayOrders } from '../hooks/use-today-orders';

import { OrderExternalDishes } from './order-external-dishes';
import { OrderList } from './order-list';
import { OrderMenuCard } from './order-menu-card';

type OrderTabProps = {
  employeeId: string;
};

export function OrderTab({ employeeId }: OrderTabProps) {
  const { data: menuData, isLoading: menuLoading } = useTodayMenu();
  const { data: orders = [], isLoading: ordersLoading } = useTodayOrders(employeeId);

  const placeOrder = usePlaceOrder(employeeId);
  const editOrder = useEditOrder(employeeId);
  const cancelOrder = useCancelOrder(employeeId);

  if (menuLoading || ordersLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Đang tải thực đơn...</div>;
  }

  const isPublished = menuData?.status === 'exists' && menuData.menu.isPublished;
  const isLocked = menuData?.status === 'exists' && menuData.menu.isLocked;
  const menuItems = menuData?.status === 'exists' ? menuData.menu.items : [];
  const externalDishes = menuData?.status === 'exists' ? menuData.menu.externalDishes : [];

  if (!isPublished) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Hôm nay chưa có thực đơn.</p>
        <p className="mt-1 text-muted-foreground">Quay lại sau nhé! 🍱</p>
      </div>
    );
  }

  const hasStandardItems = menuItems.length > 0;
  const hasExternalDishes = externalDishes.length > 0;

  return (
    <div className="space-y-4">
      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Admin đã chốt sổ. Không thể thay đổi đơn hàng.
        </div>
      )}

      {hasStandardItems && (
        <>
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Thực đơn hôm nay</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {menuItems.map((item) => (
                <OrderMenuCard
                  key={item.id}
                  item={item}
                  isLocked={isLocked}
                  isLoading={placeOrder.isPending}
                  onPlaceOrder={(itemId, quantity) => {
                    placeOrder.mutate({ employeeId, menuOfDayItemId: itemId, quantity });
                  }}
                />
              ))}
            </div>
          </div>

          <OrderList
            orders={orders}
            menuItems={menuItems}
            isLocked={isLocked}
            onEdit={(id, menuOfDayItemId, quantity) => editOrder.mutate({ id, menuOfDayItemId, quantity })}
            onCancel={(id) => cancelOrder.mutate(id)}
            isEditing={editOrder.isPending}
            isCancelling={cancelOrder.isPending}
          />
        </>
      )}

      {hasExternalDishes && <OrderExternalDishes items={externalDishes} />}
    </div>
  );
}
