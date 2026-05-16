import { TOKEN_KEY, USER_KEY } from '@/utils/constants';

export function getStorageItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(key);
}

export function clearAuthStorage(): void {
  removeStorageItem(TOKEN_KEY);
  removeStorageItem(USER_KEY);
}
