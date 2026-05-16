import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { REQUEST_RETRY_COUNT, REQUEST_TIMEOUT, TOKEN_KEY } from '@/utils/constants';
import { getStorageItem, removeStorageItem } from '@/utils/storage';
import type { ApiResponse } from '@/types/api';
import { reportError } from '@/utils/errorReporter';

const cache = new Map<string, { data: unknown; expire: number }>();

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use((config) => {
  const token = getStorageItem<string>(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse;
    if (body && typeof body === 'object' && 'success' in body && !body.success) {
      message.error(body.message || '请求失败');
      return Promise.reject(new Error(body.message));
    }
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const config = error.config as RetryConfig | undefined;

    if (status === 401) {
      removeStorageItem(TOKEN_KEY);
      message.warning('接口未授权（当前站点无需登录，可忽略）');
      return Promise.reject(error);
    }
    if (status === 403) {
      message.error('权限不足');
      window.location.href = '/403';
      return Promise.reject(error);
    }
    if (status === 500) {
      message.error('服务器异常，请稍后重试');
      reportError(error);
      return Promise.reject(error);
    }

    if (config && (!config._retryCount || config._retryCount < REQUEST_RETRY_COUNT)) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      await new Promise((r) => setTimeout(r, 500 * config._retryCount!));
      return request(config);
    }

    message.error(error.response?.data?.message || error.message || '网络异常');
    reportError(error);
    return Promise.reject(error);
  },
);

export async function httpGet<T>(
  url: string,
  config?: AxiosRequestConfig & { useCache?: boolean; cacheTtl?: number },
): Promise<T> {
  const cacheKey = `GET:${url}:${JSON.stringify(config?.params ?? {})}`;
  if (config?.useCache) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expire > Date.now()) return hit.data as T;
  }
  const res = await request.get<ApiResponse<T>>(url, config);
  const data = (res.data.data ?? res.data) as T;
  if (config?.useCache) {
    cache.set(cacheKey, { data, expire: Date.now() + (config.cacheTtl ?? 60000) });
  }
  return data;
}

export async function httpPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await request.post<ApiResponse<T>>(url, body, config);
  return (res.data.data ?? res.data) as T;
}

export default request;
