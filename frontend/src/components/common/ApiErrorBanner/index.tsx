interface ApiErrorBannerProps {
  message: string | null;
}

export function ApiErrorBanner({ message }: ApiErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="card" style={{ marginBottom: 16, borderColor: 'var(--danger)' }}>
      <p style={{ color: 'var(--danger)', margin: 0 }}>{message}</p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, marginBottom: 0 }}>
        请确认 Vercel 已设置 <code>VITE_API_BASE_URL=https://你的Railway域名/api</code>，Railway 已设置{' '}
        <code>CORS_ORIGINS=https://financial-investment-one.vercel.app</code>，并重新部署。
      </p>
    </div>
  );
}
