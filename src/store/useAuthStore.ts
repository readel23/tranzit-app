import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '../types';

interface AuthStore {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (phone: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (phone) => set({ 
        isLoggedIn: true, 
        user: { phone, isIp: false } 
      }),
      logout: () => set({ isLoggedIn: false, user: null }),
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
    }),
    { name: 'tranzit-auth-storage' }
  )
);
