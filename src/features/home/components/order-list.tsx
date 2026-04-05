'use client';

import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/atoms/select';
import { formatPrice } from '@/shared/utils/format';

import type { OrderItem } from '../types/order.type';
import type { MenuOfDayItemResponse } from '@/domains/menu';

type OrderListProps = {
  orders: OrderItem[];
  menuItems: MenuOfDayItemResponse[];
  isLocked: boolean;
  onEdit: (id: string, menuOfDayItemId: string, quantity: number) => void;
  onCancel: (id: string) => void;
  isEditing?: boolean;
  isCancelling?: boolean;
};

type EditState = {
  menuOfDayItemId: string;
  quantity: number;
};

export function OrderList({ orders, menuItems, isLocked, onEdit, onCancel, isEditing, isCancelling }: OrderListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const startEditing = (order: OrderItem) => {
    setEditingId(order.id);
    setEditState({ menuOfDayItemId: order.menuOfDayItem.id, quantity: order.quantity });
  };

  const stopEditing = () => {
    setEditingId(null);
    setEditState(null);
  };

  const handleSave = (orderId: string) => {
    if (!editState) return;
    onEdit(orderId, editState.menuOfDayItemId, editState.quantity);
    stopEditing();
  };

  const getPrice = (menuOfDayItemId: string): number => {
    return menuItems.find((i) => i.id === menuOfDayItemId)?.price ?? 0;
  };

  if (orders.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium text-foreground">Đơn của bạn hôm nay</h3>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Món</th>
              <th className="px-4 py-2 font-medium">SL</th>
              <th className="px-4 py-2 font-medium">Thành tiền</th>
              {!isLocked && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isEditable = editingId === order.id && editState;
              const currentItemId = isEditable ? editState.menuOfDayItemId : order.menuOfDayItem.id;
              const currentQty = isEditable ? editState.quantity : order.quantity;
              const currentPrice = isEditable ? getPrice(editState.menuOfDayItemId) : order.menuOfDayItem.price;

              return (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    {isEditable ? (
                      <Select
                        value={currentItemId}
                        onValueChange={(val) => setEditState((s) => s && { ...s, menuOfDayItemId: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {menuItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.menuItem.name} — {formatPrice(item.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div>
                        <span className="text-foreground">{order.menuOfDayItem.menuItem.name}</span>
                        {order.isAutoOrder && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">tự động</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isEditable ? (
                      <div className="inline-flex items-center rounded-md border border-border">
                        <button
                          type="button"
                          onClick={() => setEditState((s) => s && { ...s, quantity: Math.max(1, s.quantity - 1) })}
                          disabled={currentQty <= 1}
                          className="cursor-pointer px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm font-medium text-foreground">{currentQty}</span>
                        <button
                          type="button"
                          onClick={() => setEditState((s) => s && { ...s, quantity: s.quantity + 1 })}
                          className="cursor-pointer px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-foreground">{order.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-foreground">{formatPrice(currentPrice * currentQty)}</td>
                  {!isLocked && (
                    <td className="px-4 py-2">
                      {cancellingId === order.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Xác nhận hủy?</span>
                          <button
                            onClick={() => {
                              onCancel(order.id);
                              setCancellingId(null);
                            }}
                            disabled={isCancelling}
                            className="cursor-pointer text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                          <button
                            onClick={() => setCancellingId(null)}
                            className="cursor-pointer text-xs text-muted-foreground hover:underline"
                          >
                            Không
                          </button>
                        </div>
                      ) : isEditable ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSave(order.id)}
                            disabled={isEditing}
                            className="cursor-pointer text-xs font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={stopEditing}
                            className="cursor-pointer text-xs text-muted-foreground hover:underline"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => startEditing(order)}
                            className="cursor-pointer text-xs text-blue-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setCancellingId(order.id)}
                            className="cursor-pointer text-xs text-red-500 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
