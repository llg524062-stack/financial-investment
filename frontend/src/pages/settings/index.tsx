export default function SettingsPage() {
  return (
    <section className="panel active">
      <div className="section-header"><h2>数据源百科</h2><p>数据指标、推荐源与 API</p></div>
      <div className="ds-category">
        <div className="ds-category-header"><h3>① 行情数据</h3></div>
        <div className="card"><div className="table-wrap"><table className="ds-table">
          <thead><tr><th>指标</th><th>数据源</th></tr></thead>
          <tbody><tr><td>实时报价</td><td>yfinance / AkShare</td></tr></tbody>
        </table></div></div>
      </div>
    </section>
  );
}
