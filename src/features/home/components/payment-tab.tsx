'use client';

import { useAppConfig } from '../hooks/use-app-config';
import { usePayAll } from '../hooks/use-pay-all';
import { useUnpaidOrders } from '../hooks/use-unpaid-orders';

import { PaymentQr } from './payment-qr';
import { PaymentTable } from './payment-table';

type PaymentTabProps = {
  employeeId: string;
};

export function PaymentTab({ employeeId }: PaymentTabProps) {
  const { data: unpaidOrders = [], isLoading } = useUnpaidOrders(employeeId);
  const { data: appConfig } = useAppConfig();
  const payAll = usePayAll(employeeId);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (unpaidOrders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Bạn không có khoản nợ nào. 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PaymentTable orders={unpaidOrders} />
      <PaymentQr
        qrCodeUrl={appConfig?.qrCodeUrl ?? null}
        onConfirmPayment={() => payAll.mutate()}
        isLoading={payAll.isPending}
      />
    </div>
  );
}
