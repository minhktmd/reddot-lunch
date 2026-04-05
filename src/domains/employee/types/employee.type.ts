import { type EmployeeRole } from '../constants/employee-role.constant';

export type EmployeeListItem = {
  id: string;
  name: string;
  email: string | null;
  slackId: string | null;
  role: EmployeeRole;
  autoOrder: boolean;
  isActive: boolean;
  createdAt: string;
};
