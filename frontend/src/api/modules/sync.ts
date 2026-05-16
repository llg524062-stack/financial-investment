import { httpPost } from '@/api/request';

/** 后台同步单只股票（行情+基本面），搜索新标的后触发 */
export async function syncSymbol(code: string): Promise<string> {
  const res = await httpPost<{ symbol: string; status: string }>(`/sync/symbol/${code}`);
  return res?.status ?? 'started';
}
