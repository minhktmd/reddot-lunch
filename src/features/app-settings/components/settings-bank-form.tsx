'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronsUpDownIcon, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/shared/components/atoms/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/atoms/command';
import { Input } from '@/shared/components/atoms/input';
import { Label } from '@/shared/components/atoms/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/atoms/popover';
import { cn } from '@/shared/lib/cn';

import { useBankList } from '../hooks/use-bank-list';
import { useSaveBankConfig } from '../hooks/use-save-bank-config';
import { saveBankConfigSchema, type SaveBankConfigInput } from '../types/app-config.type';

type SettingsBankFormProps = {
  defaultValues?: Partial<SaveBankConfigInput>;
  onCancel: () => void;
  onSaved: () => void;
};

export function SettingsBankForm({ defaultValues, onCancel, onSaved }: SettingsBankFormProps) {
  const { banks } = useBankList();
  const { mutate: save, isPending } = useSaveBankConfig();
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaveBankConfigInput>({
    resolver: zodResolver(saveBankConfigSchema),
    defaultValues: {
      bankCode: defaultValues?.bankCode ?? '',
      bankAccount: defaultValues?.bankAccount ?? '',
      bankAccountName: defaultValues?.bankAccountName ?? '',
    },
  });

  const selectedBankCode = watch('bankCode');
  const selectedBank = banks.find((b) => b.bin === selectedBankCode);

  const onSubmit = (data: SaveBankConfigInput) => {
    save(data, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Ngân hàng *</Label>
        <Popover open={bankDropdownOpen} onOpenChange={setBankDropdownOpen}>
          <PopoverTrigger
            className={cn(
              'border-input bg-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
              !selectedBank && 'text-muted-foreground'
            )}
          >
            {selectedBank ? `${selectedBank.shortName} — ${selectedBank.name}` : 'Chọn ngân hàng...'}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[--anchor-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Tìm ngân hàng..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
                <CommandGroup>
                  {banks.map((bank) => (
                    <CommandItem
                      key={bank.bin}
                      value={`${bank.shortName} ${bank.name}`}
                      onSelect={() => {
                        setValue('bankCode', bank.bin, { shouldValidate: true });
                        setBankDropdownOpen(false);
                      }}
                      data-checked={bank.bin === selectedBankCode}
                    >
                      <span>
                        {bank.shortName} — {bank.name}
                      </span>
                      <CheckIcon
                        className={cn('ml-auto size-4', bank.bin === selectedBankCode ? 'opacity-100' : 'opacity-0')}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.bankCode && <p className="text-sm text-red-500">{errors.bankCode.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankAccount">Số tài khoản *</Label>
        <Input id="bankAccount" {...register('bankAccount')} placeholder="1234567890" />
        {errors.bankAccount && <p className="text-sm text-red-500">{errors.bankAccount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankAccountName">Tên chủ tài khoản *</Label>
        <Input id="bankAccountName" {...register('bankAccountName')} placeholder="VU NGOC ANH" />
        <p className="text-muted-foreground text-xs">Nhập IN HOA không dấu, ví dụ: VU NGOC ANH</p>
        {errors.bankAccountName && <p className="text-sm text-red-500">{errors.bankAccountName.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
