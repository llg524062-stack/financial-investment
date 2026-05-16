import { MOCK_DELAY_MS } from '@/utils/constants';
import type { LoginFormValues, LoginResult, UserInfo } from '@/types/user';
import type { ApiResponse } from '@/types/api';

const MOCK_USER: UserInfo = {
  id: '1',
  username: 'admin',
  displayName: '投资指挥员',
  email: 'admin@gll.com',
  roles: ['admin'],
  permissions: ['*'],
};

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY_MS));
}

/** Login — swap mock with httpPost('/auth/login', values) for production */
export async function loginApi(values: LoginFormValues): Promise<LoginResult> {
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    if (!values.username || !values.password) {
      throw new Error('请输入用户名和密码');
    }
    return delay({
      token: 'mock-jwt-token-' + Date.now(),
      user: { ...MOCK_USER, username: values.username },
    });
  }
  const { httpPost } = await import('@/api/request');
  return httpPost<LoginResult>('/auth/login', values);
}

export async function logoutApi(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    return delay(undefined);
  }
  const { httpPost } = await import('@/api/request');
  return httpPost<void>('/auth/logout');
}

export function wrapMock<T>(data: T): ApiResponse<T> {
  return { code: 0, message: 'ok', data, success: true };
}
