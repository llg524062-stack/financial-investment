import { useEffect, useState } from 'react';
import { PageLoading } from '@/components/common/PageLoading';
import { useCurrentSymbol } from '@/hooks/useCurrentSymbol';
import { fetchNewsPage, type NewsPageData } from '@/api/modules/pages';

export default function NewsPage() {
  const { symbol, isSymbolMode } = useCurrentSymbol();
  const [data, setData] = useState<NewsPageData | null>(null);

  useEffect(() => {
    void fetchNewsPage(symbol ?? undefined).then(setData);
  }, [symbol]);

  if (!data) return <PageLoading />;

  return (
    <section className="panel active">
      <div className="section-header">
        <h2>资讯与舆情{isSymbolMode && symbol ? ` · ${symbol}` : ''}</h2>
        <p>{isSymbolMode ? `与 ${symbol} 相关的资讯与全市场快讯` : '全市场资讯（选股后可筛选个股相关）'}</p>
      </div>

      <div className="bento bento-4">
        {data.sentiment_cards.map((c) => (
          <div key={c.label} className="card">
            <div className="card-label">{c.label}</div>
            <div className="card-value">{c.value}</div>
            <div className="card-meta">{c.meta}</div>
          </div>
        ))}
      </div>

      <div className="bento bento-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-label">公告时间线</div>
          <ul className="timeline">
            {data.timeline.map((t) => (
              <li key={t.date + t.title}>
                <span className="tl-date">{t.date}</span>
                <span className="tl-badge">{t.type}</span>
                <span>{t.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-label">7×24 快讯</div>
          <div className="news-feed">
            {data.flash.map((f) => (
              <a key={f.time + f.title} className="news-item news-link" href={f.url} target="_blank" rel="noreferrer">
                <span className="news-source">{f.time}</span>
                <span className={`badge badge-${f.tag === 'warn' ? 'warn' : 'neutral'}`}>{f.tag}</span>
                <span className="news-title">{f.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
