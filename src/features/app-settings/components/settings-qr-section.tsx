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
    return <div className="text-muted-foreground py-8 text-center">Đang tải...</div>;
  }

  const hasQR = Boolean(config?.qrCodeUrl);
  const qrUrl = config?.qrCodeUrl ?? null;

  if (!hasQR) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mã QR thanh toán</h2>
        <p className="text-muted-foreground text-sm">Chưa có mã QR.</p>
        <SettingsQRUpload hasExistingQR={false} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mã QR thanh toán</h2>
      <div className="rounded-lg border p-4">
        {qrUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={qrUrl} src={qrUrl} alt="Mã QR thanh toán" className="h-50 w-50 rounded-md border object-contain" />
        )}
        {config?.updatedAt && (
          <p className="text-muted-foreground mt-3 text-sm">Cập nhật: {formatUpdatedAt(config.updatedAt)}</p>
        )}
        <div className="mt-4">
          <SettingsQRUpload hasExistingQR />
        </div>
      </div>
    </div>
  );
}
