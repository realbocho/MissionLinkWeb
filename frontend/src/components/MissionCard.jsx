import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import ProgressBar from './ProgressBar.jsx'

const STATUS = { active: '진행 중', completed: '목표 달성! 🎉', expired: '만료됨' }
const BADGE = { active: 'badge-active', completed: 'badge-completed', expired: 'badge-cancelled' }

export default function MissionCard({ mission }) {
  const navigate = useNavigate()
  const current = parseInt(mission.current_amount) || 0
  const goal = parseInt(mission.goal_amount) || 0
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0

  return (
    <div className="card" onClick={() => navigate(`/mission/${mission.id}`)} style={{ cursor: 'pointer', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <Avatar user={mission.creator} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 2 }}>{mission.creator?.nickname}</div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{mission.title}</div>
        </div>
        <span className={`badge ${BADGE[mission.status]}`}>{STATUS[mission.status]}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {mission.description}
      </p>
      <ProgressBar pct={pct} current={current} goal={goal} />
    </div>
  )
}
