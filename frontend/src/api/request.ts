import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { REQUEST_RETRY_COUNT, REQUEST_TIMEOUT, TOKEN_KEY } from '@/utils/constants';
import { getStorageItem, removeStorageItem } from '@/utils/storage';
import type { ApiResponse } from '@/types/api';
import { reportError } from '@/utils/errorReporter';
import { unwrapApiData } from '@/utils/apiNormalize';

const cache = new Map<string, { data: unknown; expire: number }>();

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  /** 为 true 时不弹出 antd 错误提示（用于探测类请求） */
  silent?: boolean;
}

function normalizeBaseUrl(raw: string | undefined): string {
  const base = (raw || '/api').trim().replace(/\/+$/, '');
  return base || '/api';
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

let lastNetworkToastAt = 0;

function showNetworkError(msg: string, silent?: boolean) {
  if (silent) return;
  const now = Date.now();
  if (now - lastNetworkToastAt < 3000) return;
  lastNetworkToastAt = now;
  message.error(msg);
}

function formatRequestError(error: AxiosError<ApiResponse>): string {
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return (
        '无法连接后端（多为 CORS 或 Railway 未公网暴露）。' +
        '请确认 Railway 变量 CORS_ORIGINS 含 https://financial-investment-one.vercel.app，' +
        '且已 Generate Domain。'
      );
    }
    return error.message || '网络异常';
  }
  return error.response?.data?.message || error.message || '请求失败';
}

const request = axios.create({
  baseURL: API_BASE_URL,
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
    const silent = (response.config as RetryConfig).silent;
    if (body && typeof body === 'object' && 'success' in body && !body.success) {
      showNetworkError(body.message || '请求失败', silent);
      return Promise.reject(new Error(body.message));
    }
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const config = error.config as RetryConfig | undefined;
    const silent = config?.silent;

    if (status === 401) {
      removeStorageItem(TOKEN_KEY);
      if (!silent) message.warning('接口未授权（当前站点无需登录，可忽略）');
      return Promise.reject(error);
    }
    if (status === 403) {
      if (!silent) message.error('权限不足');
      window.location.href = '/403';
      return Promise.reject(error);
    }
    if (status === 500) {
      showNetworkError('服务器异常，请稍后重试', silent);
      reportError(error);
      return Promise.reject(error);
    }

    // 无 response：多为 CORS / DNS / 服务未启动，重试无意义
    if (!error.response) {
      const msg = formatRequestError(error);
      showNetworkError(msg, silent);
      reportError(error);
      return Promise.reject(new Error(msg));
    }

    if (config && (!config._retryCount || config._retryCount < REQUEST_RETRY_COUNT)) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      await new Promise((r) => setTimeout(r, 500 * config._retryCount!));
      return request(config);
    }

    showNetworkError(formatRequestError(error), silent);
    reportError(error);
    return Promise.reject(error);
  },
);

export async function httpGet<T>(
  url: string,
  config?: AxiosRequestConfig & { useCache?: boolean; cacheTtl?: number; silent?: boolean },
): Promise<T> {
  const cacheKey = `GET:${url}:${JSON.stringify(config?.params ?? {})}`;
  if (config?.useCache) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expire > Date.now()) return hit.data as T;
  }
  const res = await request.get<ApiResponse<T>>(url, config);
  const data = unwrapApiData<T>(res.data);
  if (config?.useCache) {
    cache.set(cacheKey, { data, expire: Date.now() + (config.cacheTtl ?? 60000) });
  }
  return data;
}

export async function httpPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig & { silent?: boolean },
): Promise<T> {
  const res = await request.post<ApiResponse<T>>(url, body, config);
  return unwrapApiData<T>(res.data);
}

export async function httpPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig & { silent?: boolean },
): Promise<T> {
  const res = await request.put<ApiResponse<T>>(url, body, config);
  return unwrapApiData<T>(res.data);
}

export default request;
