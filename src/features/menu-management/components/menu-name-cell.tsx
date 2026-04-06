'use client';

import { useState } from 'react';

import { Input } from '@/shared/components/atoms/input';

import { useMenuDraftStore } from '../stores/menu-draft.store';

type Props = {
  value: string;
  onChange: (name: string) => void;
  onSelectSuggestion: (suggestion: { name: string; price: number }) => void;
};

export function MenuNameCell({ value, onChange, onSelectSuggestion }: Props) {
  const suggestions = useMenuDraftStore((s) => s.suggestions);
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered =
    value.length > 0
      ? suggestions.filter((s) => s.name.toLowerCase().includes(value.toLowerCase()))
      : [];

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder="Tên món..."
        className="h-8 w-full border-0 bg-transparent px-2 shadow-none focus-visible:ring-1"
      />
      {showDropdown && value.length > 0 && filtered.length > 0 && (
        <div className="absolute top-full left-0 z-10 mt-1 max-h-48 w-64 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {filtered.map((s) => (
            <button
              key={s.name}
              type="button"
              className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={() => {
                onSelectSuggestion(s);
                setShowDropdown(false);
              }}
            >
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {s.price.toLocaleString('vi-VN')}đ
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
