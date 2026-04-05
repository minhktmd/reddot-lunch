export const EMPLOYEE_ROLE = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLE)[keyof typeof EMPLOYEE_ROLE];
