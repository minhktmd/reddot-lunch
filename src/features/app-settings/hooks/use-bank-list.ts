'use client';

import { useEffect, useState } from 'react';

import { logger } from '@/shared/lib/logger';

import type { BankItem } from '../types/app-config.type';

const FALLBACK_BANKS: BankItem[] = [
  { bin: '970422', shortName: 'MB', name: 'Ngân hàng Quân đội' },
  { bin: '970436', shortName: 'VCB', name: 'Vietcombank' },
  { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng Kỹ thương' },
  { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng Công thương' },
  { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển' },
  { bin: '970405', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp' },
  { bin: '970448', shortName: 'OCB', name: 'Ngân hàng Phương Đông' },
  { bin: '970426', shortName: 'MSB', name: 'Ngân hàng Hàng Hải' },
  { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong' },
];

export function useBankList() {
  const [banks, setBanks] = useState<BankItem[]>(FALLBACK_BANKS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('https://api.vietqr.io/v2/banks')
      .then((res) => res.json())
      .then((json: { data?: { bin: string; shortName: string; name: string }[] }) => {
        if (cancelled) return;
        if (Array.isArray(json.data) && json.data.length > 0) {
          setBanks(json.data.map((b) => ({ bin: b.bin, shortName: b.shortName, name: b.name })));
        }
      })
      .catch((err) => {
        logger.error('[useBankList] Failed to fetch bank list', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { banks, isLoading };
}
