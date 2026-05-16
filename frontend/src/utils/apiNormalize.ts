import type { ApiResponse } from '@/types/api';

/** 从后端统一响应中提取 data，避免把整个 ApiResponse 当成业务数据 */
export function unwrapApiData<T>(body: unknown): T {
  if (body !== null && typeof body === 'object' && 'data' in body) {
    const wrapped = body as ApiResponse<T>;
    if (wrapped.data !== undefined && wrapped.data !== null) {
      return wrapped.data;
    }
    if ('success' in wrapped) {
      throw new Error(wrapped.message || '接口未返回 data');
    }
  }
  return body as T;
}

export function asArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}
