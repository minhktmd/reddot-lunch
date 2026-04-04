import { create } from 'zustand';

import type { User } from '@/domains/user';

type AuthState = {
  accessToken: string | null;
  user: User | null;
};

type AuthActions = {
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setAuth: (accessToken, user) => set({ accessToken, user }),

  clearAuth: () => set(initialState),
}));
