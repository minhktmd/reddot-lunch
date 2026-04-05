'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/shared/lib/cn';

import { Button } from './button';

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onOpenChange(false);
      }}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        role="alertdialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-gray-900">{children}</h2>;
}

export function AlertDialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mt-2 text-sm text-gray-600', className)}>{children}</div>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>;
}

export function AlertDialogCancel({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      {children}
    </Button>
  );
}

export function AlertDialogAction({
  children,
  onClick,
  disabled,
  variant = 'destructive',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Button variant={variant} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
