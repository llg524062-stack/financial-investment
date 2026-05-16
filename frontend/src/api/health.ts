import { httpGet } from '@/api/request';
import { asArray } from '@/utils/apiNormalize';

export type BackendProbeState = 'checking' | 'misconfigured' | 'offline' | 'empty' | 'ready';

export interface BackendProbeResult {
  state: BackendProbeState;
  message: string;
  apiBase: string;
  watchlistCount: number;
}

export function getConfiguredApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL || '/api';
}

/** 检测前端是否已正确对接 Railway 后端 */
export async function probeBackend(): Promise<BackendProbeResult> {
  const apiBase = getConfiguredApiBase();

  if (!import.meta.env.DEV && (apiBase === '/api' || apiBase.startsWith('/'))) {
    return {
      state: 'misconfigured',
      apiBase,
      watchlistCount: 0,
      message:
        '生产环境未配置后端地址：请在 Vercel 设置 VITE_API_BASE_URL=https://你的Railway域名/api 并重新部署',
    };
  }

  try {
    await httpGet<{ status: string }>('/health');
    const watchlist = asArray<{ symbol: string }>(await httpGet<unknown>('/market/watchlist'));
    if (watchlist.length === 0) {
      return {
        state: 'empty',
        apiBase,
        watchlistCount: 0,
        message: '后端已连通，但数据库暂无行情。请在 Railway 执行全量同步（RUN_SYNC_ON_STARTUP 或 POST /api/sync/run-now）',
      };
    }
    return {
      state: 'ready',
      apiBase,
      watchlistCount: watchlist.length,
      message: `后端已连通，已加载 ${watchlist.length} 只自选股`,
    };
  } catch (err) {
    return {
      state: 'offline',
      apiBase,
      watchlistCount: 0,
      message:
        err instanceof Error
          ? err.message
          : '无法访问后端 API，请检查 Railway 是否运行、CORS 是否包含 financial-investment-one.vercel.app',
    };
  }
}
