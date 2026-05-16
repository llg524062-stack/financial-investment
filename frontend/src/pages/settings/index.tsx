import { useEffect, useState } from 'react';
import { PageLoading } from '@/components/common/PageLoading';
import { fetchSettingsPage, type SettingsPageData } from '@/api/modules/pages';

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPageData | null>(null);

  useEffect(() => {
    void fetchSettingsPage().then(setData);
  }, []);

  if (!data) return <PageLoading />;

  return (
    <section className="panel active">
      <div className="section-header">
        <h2>数据源百科</h2>
        <p>各模块数据从哪来、是否免费、怎么调用</p>
      </div>
      {data.categories.map((cat) => (
        <div key={cat.id} className="card" style={{ marginBottom: 24 }}>
          <div className="card-label">{cat.title}</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{cat.subtitle}</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>数据项</th><th>用途</th><th>来源</th><th>费用</th><th>接口</th></tr></thead>
              <tbody>
                {cat.rows.map((row) => (
                  <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
