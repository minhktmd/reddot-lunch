'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/atoms/button';

import { useUploadQR } from '../hooks/use-upload-qr';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = 'image/png, image/jpeg, image/webp';

type SettingsQRUploadProps = {
  hasExistingQR: boolean;
};

export function SettingsQRUpload({ hasExistingQR }: SettingsQRUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending } = useUploadQR();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ảnh vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.');
      resetInput();
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    if (!selectedFile) return;

    upload(selectedFile, {
      onSettled: () => {
        resetInput();
      },
    });
  };

  const handleCancel = () => {
    resetInput();
  };

  const resetInput = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} className="hidden" />

      {previewUrl ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm font-medium">Xem trước:</p>
          <img src={previewUrl} alt="Xem trước QR" className="h-50 w-50 rounded-md border object-contain" />
          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Đang tải...' : 'Xác nhận tải lên'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <Button variant={hasExistingQR ? 'outline' : 'default'} onClick={() => fileInputRef.current?.click()}>
          {hasExistingQR ? 'Tải ảnh mới lên' : 'Tải ảnh lên'}
        </Button>
      )}
    </div>
  );
}
