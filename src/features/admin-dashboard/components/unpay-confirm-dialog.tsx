'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/atoms/alert-dialog';

type Props = {
  open: boolean;
  employeeName: string;
  amount: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function UnpayConfirmDialog({ open, employeeName, amount, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hoàn tác thanh toán</AlertDialogTitle>
          <AlertDialogDescription>
            Xác nhận hoàn tác thanh toán {amount} của {employeeName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Hủy</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Hoàn tác
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
