import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMissions } from '../utils/api.js'
import MissionCard from '../components/MissionCard.jsx'
import Avatar from '../components/Avatar.jsx'
import { copyToClipboard, showAlert, getCreatorLink, getWebUser, formatAmount } from '../utils/web.js'

export default function CreatorProfile() {
  const { creatorId } = useParams()
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [creator, setCreator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const webUser = getWebUser()
  const isOwnProfile = webUser && String(webUser.id) === String(creatorId)

  useEffect(() => {
    console.log('[CreatorProfile] creatorId:', creatorId)
    Promise.all([
      getMissions({ creator_id: creatorId, status: 'active' }),
      getMissions({ creator_id: creatorId, status: 'completed' }),
      getMissions({ creator_id: creatorId, status: 'expired' }),
    ])
      .then(([active, completed, expired]) => {
        const all = [...active, ...completed, ...expired]
        setMissions(all)
        if (all.length > 0) setCreator(all[0].creator)
        else {
          // 미션 없어도 유저 정보 가져오기
          import('../utils/api.js').then(({ default: api }) => {
            api.get(`/users/${creatorId}`).then(setCreator).catch(() => {})
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [creatorId])

  const handleShareProfile = async () => {
    await copyToClipboard(getCreatorLink(creatorId))
    showAlert('프로필 링크 복사됨! 📋\n모든 미션을 볼 수 있는 링크예요.')
  }

  const active = missions.filter(m => m.status === 'active')
  const completed = missions.filter(m => m.status === 'completed')
  const expired = missions.filter(m => m.status === 'expired')
  const totalRaised = missions.reduce((s, m) => s + (parseInt(m.current_amount) || 0), 0)

  const tabList = [
    { key: 'active', label: `진행 중 (${active.length})`, items: active },
    { key: 'completed', label: `목표 달성 (${completed.length})`, items: completed },
    { key: 'expired', label: `만료 (${expired.length})`, items: expired },
  ].filter(t => t.items.length > 0)

  const currentItems = tabList.find(t => t.key === tab)?.items || active

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">크리에이터</span>
      </div>
      <div className="page" style={{ paddingTop: 12 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', marginBottom: 20, paddingBottom: 20,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <Avatar user={creator} size={72} />
          <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 12 }}>
            {creator?.nickname || '크리에이터'}
          </h1>

          <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{active.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>진행 중</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{completed.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>목표 달성</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{formatAmount(totalRaised)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>총 후원 의향</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, width: '100%', maxWidth: 280 }}>
            <button className="btn-secondary" onClick={handleShareProfile} style={{ flex: 1 }}>
              🔗 프로필 공유
            </button>
            {!isOwnProfile && (
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate(`/creator/${creatorId}/request`)}
              >
                ✉️ 미션 요청
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        {tabList.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {tabList.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 14px', borderRadius: 99,
                  background: tab === t.key ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: tab === t.key ? 'white' : 'var(--text-hint)',
                  fontWeight: tab === t.key ? 700 : 400,
                  fontSize: 13, border: 'none', cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="spinner" />}

        {!loading && missions.length === 0 && (
          <div className="empty">
            <div className="icon">🌱</div>
            <div>아직 미션이 없어요</div>
          </div>
        )}

        {currentItems.map(m => (
          <div key={m.id} style={{ opacity: m.status !== 'active' ? 0.7 : 1 }}>
            <MissionCard mission={m} />
          </div>
        ))}
      </div>
    </div>
  )
}
