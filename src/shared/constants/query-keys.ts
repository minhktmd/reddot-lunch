// Centralized query key factory — never write inline string arrays in useQuery calls
// Usage: queryKeys.users.all, queryKeys.users.detail(id)

export const queryKeys = {
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
} as const;
