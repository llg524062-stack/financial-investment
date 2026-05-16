import { DEMO_PASSWORD, DEMO_USERNAME, MOCK_DELAY_MS } from '@/utils/constants';
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

/** Login — swap mock with httpPost('/auth/login', values) when VITE_USE_MOCK=false */
export async function loginApi(values: LoginFormValues): Promise<LoginResult> {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

  if (useMock) {
    if (!values.username?.trim() || !values.password?.trim()) {
      throw new Error('请输入用户名和密码');
    }
    const user = values.username.trim();
    const pass = values.password.trim();
    if (user !== DEMO_USERNAME || pass !== DEMO_PASSWORD) {
      throw new Error(`演示账号：${DEMO_USERNAME} / ${DEMO_PASSWORD}`);
    }
    return delay({
      token: 'mock-jwt-token-' + Date.now(),
      user: { ...MOCK_USER, username: user },
    });
  }

  try {
    const { httpPost } = await import('@/api/request');
    return await httpPost<LoginResult>('/auth/login', values);
  } catch {
    throw new Error('登录服务不可用，请确认后端 API 或联系管理员');
  }
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
