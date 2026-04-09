'use client';

import { buildVietQRUrl } from '@/shared/utils/viet-qr';

type SettingsQRPreviewProps = {
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
};

export function SettingsQRPreview({ bankCode, bankAccount, bankAccountName }: SettingsQRPreviewProps) {
  const qrUrl = buildVietQRUrl({
    bankCode,
    bankAccount,
    bankAccountName,
    amount: 10000,
    addInfo: 'preview',
  });

  return (
    <div className="flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="QR xem trước" width={200} height={200} className="rounded-md border object-contain" />
    </div>
  );
}
