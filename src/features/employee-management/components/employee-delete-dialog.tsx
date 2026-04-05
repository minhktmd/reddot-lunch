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

import { useDeleteEmployee } from '../hooks/use-delete-employee';

type EmployeeDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: { id: string; name: string };
};

export function EmployeeDeleteDialog({ open, onOpenChange, employee }: EmployeeDeleteDialogProps) {
  const { mutate: deleteEmployee, isPending } = useDeleteEmployee();

  const handleConfirm = () => {
    deleteEmployee(
      { id: employee.id, name: employee.name },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa nhân viên {employee.name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-red-600">
            <p className="font-medium">
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Tất cả lịch sử đặt cơm của nhân viên này</li>
              <li>Các đơn hàng chưa thanh toán cũng sẽ bị mất</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isPending}>
            Xóa vĩnh viễn
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
