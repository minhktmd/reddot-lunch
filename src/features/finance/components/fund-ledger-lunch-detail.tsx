'use client';

type FundLedgerLunchDetailProps = {
  dishes: { name: string; quantity: number; subtotal: number }[];
  orderCount: number;
  totalAmount: number;
};

export function FundLedgerLunchDetail({ dishes, orderCount, totalAmount }: FundLedgerLunchDetailProps) {
  return (
    <div className="bg-muted/50 mt-1 rounded-md border p-3 text-sm">
      <div className="space-y-1">
        {dishes.map((dish) => (
          <div key={dish.name} className="flex justify-between">
            <span>
              {dish.name} ×{dish.quantity}
            </span>
            <span>{dish.subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
        ))}
      </div>
      <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
        {orderCount} suất — Tổng: {Math.abs(totalAmount).toLocaleString('vi-VN')}đ
      </div>
    </div>
  );
}
