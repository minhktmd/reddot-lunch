// Centralized query key factory — never write inline string arrays in useQuery calls
// Usage: queryKeys.users.all, queryKeys.users.detail(id)

export const queryKeys = {
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    detail: (id: string) => [...queryKeys.employees.all, 'detail', id] as const,
  },
  menu: {
    today: ['menu', 'today'] as const,
    suggestions: ['menu', 'suggestions'] as const,
  },
  orders: {
    today: ['orders', 'today'] as const,
    byEmployee: (employeeId: string, date: string) => ['orders', 'employee', employeeId, date] as const,
    unpaid: (employeeId: string) => ['orders', 'unpaid', employeeId] as const,
  },
  report: {
    monthly: (month: string) => ['report', 'monthly', month] as const,
    employee: (employeeId: string, month: string) => ['report', 'employee', employeeId, month] as const,
  },
  appConfig: ['app-config'] as const,
} as const;
