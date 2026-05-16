import { useEffect, useState } from 'react';

/** 拉取页面数据：失败时返回 fallback，避免白屏 */
export function usePageLoader<T>(
  loader: () => Promise<T>,
  fallback: T,
  deps: unknown[],
): { data: T; loading: boolean; error: string | null } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void loader()
      .then((result) => setData(result))
      .catch((err: unknown) => {
        setData(fallback);
        setError(err instanceof Error ? err.message : '数据加载失败');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps 由调用方传入
  }, deps);

  return { data, loading, error };
}
