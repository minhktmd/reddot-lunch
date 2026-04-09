'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/atoms/button';

import { useAppConfig } from '../hooks/use-app-config';
import { useBankList } from '../hooks/use-bank-list';

import { SettingsBankForm } from './settings-bank-form';
import { SettingsQRPreview } from './settings-qr-preview';

function formatUpdatedAt(isoString: string): string {
  const date = new Date(isoString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} lúc ${hh}:${min}`;
}

export function SettingsBankSection() {
  const { data: config, isLoading } = useAppConfig();
  const { banks } = useBankList();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center">Đang tải...</div>;
  }

  const isConfigured = Boolean(config?.bankCode && config?.bankAccount && config?.bankAccountName);
  const selectedBank = banks.find((b) => b.bin === config?.bankCode);

  if (!isConfigured && !isEditing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tài khoản nhận tiền</h2>
        <p className="text-muted-foreground text-sm">Chưa có thông tin tài khoản ngân hàng.</p>
        <p className="text-muted-foreground text-sm">Cấu hình để thành viên có thể quét mã QR nạp tiền.</p>
        <Button onClick={() => setIsEditing(true)}>Cài đặt ngay</Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tài khoản nhận tiền</h2>
        <SettingsBankForm
          defaultValues={
            isConfigured
              ? {
                  bankCode: config!.bankCode!,
                  bankAccount: config!.bankAccount!,
                  bankAccountName: config!.bankAccountName!,
                }
              : undefined
          }
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tài khoản nhận tiền</h2>
      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngân hàng:</span>
            <span className="font-medium">
              {selectedBank ? `${selectedBank.shortName} — ${selectedBank.name}` : config!.bankCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số tài khoản:</span>
            <span className="font-medium">{config!.bankAccount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chủ tài khoản:</span>
            <span className="font-medium">{config!.bankAccountName}</span>
          </div>
        </div>

        <SettingsQRPreview
          bankCode={config!.bankCode!}
          bankAccount={config!.bankAccount!}
          bankAccountName={config!.bankAccountName!}
        />

        {config?.updatedAt && (
          <p className="text-muted-foreground text-sm">Cập nhật: {formatUpdatedAt(config.updatedAt)}</p>
        )}

        <Button variant="outline" onClick={() => setIsEditing(true)}>
          Chỉnh sửa
        </Button>
      </div>
    </div>
  );
}
