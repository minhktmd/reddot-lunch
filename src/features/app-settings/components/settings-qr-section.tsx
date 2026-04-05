'use client';

import { useAppConfig } from '../hooks/use-app-config';
import { SettingsQRUpload } from './settings-qr-upload';

function formatUpdatedAt(isoString: string): string {
  const date = new Date(isoString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} lúc ${hh}:${min}`;
}

export function SettingsQRSection() {
  const { data: config, isLoading } = useAppConfig();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Đang tải...</div>;
  }

  const hasQR = Boolean(config?.qrCodeUrl);
  const qrUrl = config?.qrCodeUrl ? `${config.qrCodeUrl}?t=${Date.now()}` : null;

  if (!hasQR) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mã QR thanh toán</h2>
        <p className="text-sm text-muted-foreground">Chưa có mã QR.</p>
        <SettingsQRUpload hasExistingQR={false} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mã QR thanh toán</h2>
      <div className="rounded-lg border p-4">
        {qrUrl && (
          <img src={qrUrl} alt="Mã QR thanh toán" className="h-[200px] w-[200px] rounded-md border object-contain" />
        )}
        {config?.updatedAt && (
          <p className="mt-3 text-sm text-muted-foreground">Cập nhật: {formatUpdatedAt(config.updatedAt)}</p>
        )}
        <div className="mt-4">
          <SettingsQRUpload hasExistingQR />
        </div>
      </div>
    </div>
  );
}
