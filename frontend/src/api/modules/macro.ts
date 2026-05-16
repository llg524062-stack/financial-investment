import { httpGet } from '@/api/request';

export interface MacroIndicator {
  series_id: string;
  label: string;
  value: number;
  unit: string;
  date: string;
}

export async function fetchMacroOverview(): Promise<MacroIndicator[]> {
  return httpGet<MacroIndicator[]>('/macro/overview', { useCache: true });
}
