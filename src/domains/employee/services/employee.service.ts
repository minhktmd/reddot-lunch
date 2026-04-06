import { z } from 'zod';

import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

import { EMPLOYEE_ROLE } from '../constants/employee-role.constant';

import type { EmployeeListItem } from '../types/employee.type';

const employeeListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  slackId: z.string().nullable(),
  role: z.enum([EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MEMBER]),
  autoOrder: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export async function getEmployees(): Promise<EmployeeListItem[]> {
  const response = await apiClient.get<unknown>('/api/employees');
  const result = z.array(employeeListItemSchema).safeParse(response.data);
  if (!result.success) {
    logger.error('[getEmployees] Invalid response', result.error);
    return [];
  }
  return result.data;
}

export async function updateEmployee(id: string, data: { autoOrder?: boolean }): Promise<void> {
  await apiClient.patch(`/api/employees/${id}`, data);
}
