'use client';

import { useMemo } from 'react';

import { removeDiacritics } from '@/shared/utils/text';
import { buildVietQRUrl } from '@/shared/utils/viet-qr';

import type { AppConfigResponse } from '@/features/app-settings';

type FinanceQRDisplayProps = {
  config: AppConfigResponse;
  amount: number;
  employeeName: string;
};

export function FinanceQRDisplay({ config, amount, employeeName }: FinanceQRDisplayProps) {
  const isConfigured = Boolean(config.bankCode && config.bankAccount && config.bankAccountName);

  const addInfo = useMemo(
    () => `RDL - ${removeDiacritics(employeeName)} chuyen tien an trua`,
    [employeeName]
  );

  if (!isConfigured) {
    return (
      <p className="text-muted-foreground text-sm">Admin chưa cài đặt tài khoản ngân hàng</p>
    );
  }

  if (amount <= 0) return null;

  const qrUrl = buildVietQRUrl({
    bankCode: config.bankCode!,
    bankAccount: config.bankAccount!,
    bankAccountName: config.bankAccountName!,
    amount,
    addInfo,
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-center">
        <div className="bg-card overflow-hidden rounded-lg border p-3 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="Mã QR chuyển khoản" width={200} height={200} className="object-contain" />
        </div>
      </div>
      <p className="text-muted-foreground text-center text-xs">Nội dung: {addInfo}</p>
      <p className="text-muted-foreground text-center text-xs">
        {config.bankAccount} — {config.bankAccountName}
      </p>
    </div>
  );
}
