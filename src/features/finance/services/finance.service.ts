import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import {
  balanceResponseSchema,
  financeSummaryResponseSchema,
  fundLedgerResponseSchema,
  ledgerEntryItemSchema,
  type BalanceResponse,
  type FinanceSummaryResponse,
  type FundLedgerResponse,
  type LedgerEntryItem,
} from '../types/finance.type';

export async function getBalance(employeeId: string): Promise<BalanceResponse> {
  const response = await apiClient.get<unknown>('/api/finance/balance', { params: { employeeId } });
  const result = balanceResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getBalance] Invalid response', result.error);
    return { employeeId, balance: 0 };
  }
  return result.data;
}

export async function getLedger(employeeId: string): Promise<LedgerEntryItem[]> {
  const response = await apiClient.get<unknown>('/api/finance/ledger', { params: { employeeId } });
  const result = z.array(ledgerEntryItemSchema).safeParse(response.data);
  if (!result.success) {
    logger.error('[getLedger] Invalid response', result.error);
    return [];
  }
  return result.data;
}

export async function getFinanceSummary(): Promise<FinanceSummaryResponse> {
  const response = await apiClient.get<unknown>('/api/finance/summary');
  const result = financeSummaryResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getFinanceSummary] Invalid response', result.error);
    return { fundBalance: 0, employees: [] };
  }
  return result.data;
}

export async function topup(data: {
  employeeId: string;
  amount: number;
  createdBy?: string;
}): Promise<BalanceResponse> {
  const response = await apiClient.post<unknown>('/api/finance/topup', data);
  const result = balanceResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[topup] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function adjustBalance(data: {
  employeeId: string;
  targetBalance: number;
  note?: string;
  adminEmployeeId: string;
}): Promise<BalanceResponse> {
  const response = await apiClient.post<unknown>('/api/finance/adjust', data);
  const result = balanceResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[adjustBalance] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }
  return result.data;
}

export async function getFundLedger(month: string): Promise<FundLedgerResponse> {
  const response = await apiClient.get<unknown>('/api/finance/fund-ledger', { params: { month } });
  const result = fundLedgerResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getFundLedger] Invalid response', result.error);
    return { month, items: [] };
  }
  return result.data;
}
