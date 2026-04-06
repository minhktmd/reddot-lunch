import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import {
  monthlyReportResponseSchema,
  employeeReportResponseSchema,
  type MonthlyReportResponse,
  type EmployeeReportResponse,
} from '../types/report.type';

export async function getMonthlyReport(month: string): Promise<MonthlyReportResponse> {
  const response = await apiClient.get<unknown>('/api/report/monthly', { params: { month } });
  const result = monthlyReportResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getMonthlyReport] Invalid response', result.error);
    return { month, rows: [] };
  }
  return result.data;
}

export async function getEmployeeReport(employeeId: string, month: string): Promise<EmployeeReportResponse> {
  const response = await apiClient.get<unknown>(`/api/report/employee/${employeeId}`, { params: { month } });
  const result = employeeReportResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getEmployeeReport] Invalid response', result.error);
    return { employee: { id: employeeId, name: '' }, month, orders: [] };
  }
  return result.data;
}
