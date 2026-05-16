export default function NewsPage() {
  const items = [
    { title: '英伟达发布 Blackwell 架构', source: '财联社', url: 'https://www.cls.cn' },
    { title: '美联储维持利率不变', source: '华尔街见闻', url: 'https://wallstreetcn.com' },
  ];
  return (
    <section className="panel active">
      <div className="section-header"><h2>资讯与舆情</h2></div>
      <div className="news-feed">
        {items.map((n) => (
          <a key={n.title} className="news-item news-link" href={n.url} target="_blank" rel="noreferrer">
            <span className="news-source">{n.source}</span>
            <span className="news-title">{n.title}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
