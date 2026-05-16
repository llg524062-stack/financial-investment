import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { REMEMBER_KEY, TOKEN_KEY, USER_KEY } from '@/utils/constants';
import { clearAuthStorage, getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';
import type { UserInfo } from '@/types/user';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  setAuth: (token: string, user: UserInfo, remember?: boolean) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: getStorageItem<string>(TOKEN_KEY),
      user: getStorageItem<UserInfo>(USER_KEY),
      setAuth: (token, user, remember = true) => {
        setStorageItem(TOKEN_KEY, token);
        setStorageItem(USER_KEY, user);
        if (remember) setStorageItem(REMEMBER_KEY, true);
        set({ token, user });
      },
      clearAuth: () => {
        clearAuthStorage();
        removeStorageItem(REMEMBER_KEY);
        removeStorageItem('gll-auth-store');
        set({ token: null, user: null });
      },
      isAuthenticated: () => Boolean(get().token),
    }),
    { name: 'gll-auth-store', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
