import { httpGet } from '@/api/request';

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  published_at: string;
  symbol?: string | null;
  sentiment?: string;
}

export async function fetchNews(limit = 40, symbol?: string): Promise<NewsArticle[]> {
  return httpGet<NewsArticle[]>('/news', { params: { limit, symbol }, useCache: true, cacheTtl: 120000 });
}
