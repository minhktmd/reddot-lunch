'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type HomeStore = {
  selectedEmployeeId: string | null;
  setSelectedEmployee: (id: string) => void;
  clearSelectedEmployee: () => void;
};

const initialState = {
  selectedEmployeeId: null,
};

export const useHomeStore = create<HomeStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedEmployee: (id: string) => set({ selectedEmployeeId: id }),
      clearSelectedEmployee: () => set({ selectedEmployeeId: null }),
    }),
    { name: 'home-store' }
  )
);
