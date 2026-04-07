'use client';

import Image from 'next/image';

type PaymentQrProps = {
  qrCodeUrl: string | null;
  onConfirmPayment: () => void;
  isLoading?: boolean;
};

export function PaymentQr({ qrCodeUrl, onConfirmPayment, isLoading }: PaymentQrProps) {
  return (
    <div className="space-y-4">
      {qrCodeUrl && (
        <div className="flex justify-center">
          <div className="bg-card overflow-hidden rounded-lg border p-3 shadow-sm">
            <Image src={qrCodeUrl} alt="Mã QR chuyển khoản" width={200} height={200} className="object-contain" />
          </div>
        </div>
      )}

      <button
        onClick={onConfirmPayment}
        disabled={isLoading}
        className="w-full cursor-pointer rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Đang xử lý...' : 'Xác nhận đã chuyển khoản'}
      </button>
    </div>
  );
}
