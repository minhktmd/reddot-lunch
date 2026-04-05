import { z } from 'zod';

import { EMPLOYEE_ROLE, type EmployeeListItem } from '@/domains/employee';
import { logger } from '@/shared/lib/logger';
import { apiClient } from '@/shared/services/api';

const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  slackId: z.string().nullable(),
  role: z.enum([EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MEMBER]),
  autoOrder: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

const employeeListSchema = z.array(employeeSchema);

export async function getAllEmployees(): Promise<EmployeeListItem[]> {
  const response = await apiClient.get<unknown>('/api/employees', {
    params: { includeInactive: true },
  });

  const result = employeeListSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[getAllEmployees] Invalid response', result.error);
    return [];
  }

  return result.data;
}

export async function addEmployee(data: {
  name: string;
  email?: string;
  slackId?: string;
  role?: string;
}): Promise<EmployeeListItem> {
  const response = await apiClient.post<unknown>('/api/employees', {
    name: data.name,
    email: data.email || null,
    slackId: data.slackId || null,
    role: data.role,
  });

  const result = employeeSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[addEmployee] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }

  return result.data;
}

const deleteEmployeeResponseSchema = z.object({
  deleted: z.boolean(),
  ordersDeleted: z.number(),
});

export type DeleteEmployeeResponse = z.infer<typeof deleteEmployeeResponseSchema>;

export async function deleteEmployee(id: string): Promise<DeleteEmployeeResponse> {
  const response = await apiClient.delete<unknown>(`/api/employees/${id}`);

  const result = deleteEmployeeResponseSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[deleteEmployee] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }

  return result.data;
}

export async function editEmployee(
  id: string,
  data: {
    name?: string;
    email?: string;
    slackId?: string;
    role?: string;
    isActive?: boolean;
  }
): Promise<EmployeeListItem> {
  const response = await apiClient.patch<unknown>(`/api/employees/${id}`, {
    ...data,
    email: data.email !== undefined ? data.email || null : undefined,
    slackId: data.slackId !== undefined ? data.slackId || null : undefined,
  });

  const result = employeeSchema.safeParse(response.data);
  if (!result.success) {
    logger.error('[editEmployee] Invalid response', result.error);
    throw new Error('Phản hồi không hợp lệ');
  }

  return result.data;
}
