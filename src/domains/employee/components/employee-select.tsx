'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/atoms/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/atoms/popover';

import type { EmployeeListItem } from '../types/employee.type';

type EmployeeSelectProps = {
  employees: EmployeeListItem[];
  value: string | null;
  onChange: (id: string) => void;

  disabled?: boolean;
  placeholder?: string;
};

export function EmployeeSelect({
  employees,
  value,
  onChange,
  disabled,
  placeholder = 'Chọn tên của bạn',
}: EmployeeSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedEmployee = employees.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled}>
        <span
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn(
            'inline-flex h-11 w-full items-center justify-between rounded-md border border-border bg-transparent px-4 text-left text-sm transition-colors hover:bg-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {selectedEmployee ? (
            selectedEmployee.name
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm tên..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.name}
                  onSelect={() => {
                    onChange(employee.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === employee.id ? 'opacity-100' : 'opacity-0')} />
                  {employee.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
