import { z } from 'zod';

import { EMPLOYEE_ROLE } from '@/domains/employee';

export const addEmployeeSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).optional(),
  slackId: z.string().optional(),
  role: z.enum([EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MEMBER]),
});

export type AddEmployeeInput = z.infer<typeof addEmployeeSchema>;

export const editEmployeeSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).optional(),
  slackId: z.string().optional(),
  role: z.enum([EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MEMBER]),
});

export type EditEmployeeInput = z.infer<typeof editEmployeeSchema>;
