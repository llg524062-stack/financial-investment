/** Shows whether field data is live, rule-based, or synthetic/demo. */
export type DataSourceKind = 'live' | 'rules' | 'synthetic' | 'static' | 'unavailable';

const LABELS: Record<DataSourceKind, string> = {
  live: '实时',
  rules: '规则引擎',
  synthetic: '示意',
  static: '静态',
  unavailable: '暂无',
};

const CLASS: Record<DataSourceKind, string> = {
  live: 'badge-up',
  rules: 'badge-neutral',
  synthetic: 'badge-warn',
  static: 'badge-neutral',
  unavailable: 'badge-down',
};

export function DataSourceTag({ source, title }: { source?: string; title?: string }) {
  if (!source) return null;
  const kind = (source in LABELS ? source : 'synthetic') as DataSourceKind;
  return (
    <span
      className={`badge ${CLASS[kind]}`}
      style={{ marginLeft: 8, fontSize: 10, verticalAlign: 'middle' }}
      title={title ?? `数据来源：${LABELS[kind]}`}
    >
      {LABELS[kind]}
    </span>
  );
}
