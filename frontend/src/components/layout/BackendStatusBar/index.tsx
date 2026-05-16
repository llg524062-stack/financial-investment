import { useCallback, useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { probeBackend, type BackendProbeResult } from '@/api/health';
import { httpPost } from '@/api/request';

const STATE_STYLE: Record<BackendProbeResult['state'], { bg: string; border: string }> = {
  checking: { bg: 'rgba(148,163,184,0.08)', border: 'var(--border)' },
  misconfigured: { bg: 'rgba(239,68,68,0.08)', border: 'var(--danger)' },
  offline: { bg: 'rgba(239,68,68,0.08)', border: 'var(--danger)' },
  empty: { bg: 'rgba(245,158,11,0.1)', border: 'var(--warning)' },
  ready: { bg: 'rgba(16,185,129,0.08)', border: 'var(--accent)' },
};

export function BackendStatusBar() {
  const [probe, setProbe] = useState<BackendProbeResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setProbe(null);
    void probeBackend().then(setProbe);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runSync = () => {
    setSyncing(true);
    void httpPost('/sync/run-now')
      .then(() => {
        message.success('已触发全量同步，约需 3–10 分钟，请稍后点击刷新');
        setTimeout(refresh, 5000);
      })
      .catch(() => message.error('同步请求失败，请检查后端日志'))
      .finally(() => setSyncing(false));
  };

  if (!probe) {
    return (
      <div className="card" style={{ marginBottom: 16, padding: '10px 16px' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>正在检测后端连接…</span>
      </div>
    );
  }

  if (probe.state === 'ready') {
    return (
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '8px 16px',
          background: STATE_STYLE.ready.bg,
          borderColor: STATE_STYLE.ready.border,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--accent)' }}>● {probe.message}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 12 }}>{probe.apiBase}</span>
        <Button type="link" size="small" onClick={refresh} style={{ float: 'right', padding: 0 }}>
          刷新
        </Button>
      </div>
    );
  }

  const style = STATE_STYLE[probe.state];

  return (
    <div
      className="card"
      style={{ marginBottom: 16, padding: '12px 16px', background: style.bg, borderColor: style.border }}
    >
      <p style={{ margin: 0, fontSize: 13, color: probe.state === 'empty' ? 'var(--warning)' : 'var(--danger)' }}>
        {probe.state === 'misconfigured' && '⚠ 未配置后端 API'}
        {probe.state === 'offline' && '✕ 后端未连通'}
        {probe.state === 'empty' && '◐ 后端已连通，暂无数据'}
        {' — '}
        {probe.message}
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
        当前请求地址：<code>{probe.apiBase}</code>
        {probe.state === 'misconfigured' && (
          <>
            {' '}
            → 应在 Vercel 配置为 <code>https://xxx.up.railway.app/api</code>
          </>
        )}
      </p>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="small" onClick={refresh}>
          重新检测
        </Button>
        {probe.state === 'empty' && (
          <Button size="small" type="primary" loading={syncing} onClick={runSync}>
            触发全量同步
          </Button>
        )}
      </div>
    </div>
  );
}
