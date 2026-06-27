export default function ProgressBar({ pct, current, goal }) {
  const c = parseInt(current) || 0
  const g = parseInt(goal) || 0
  const p = isNaN(pct) ? 0 : pct
  const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n) + '원'

  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${p}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-hint)' }}>
          <b style={{ color: 'var(--accent)', fontSize: 15 }}>{fmt(c)}</b> 모임
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-hint)' }}>
          목표 {fmt(g)} · <b>{p}%</b>
        </span>
      </div>
    </div>
  )
}
