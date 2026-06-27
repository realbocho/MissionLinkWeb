import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMissions } from '../utils/api.js'
import MissionCard from '../components/MissionCard.jsx'
import Avatar from '../components/Avatar.jsx'
import { copyToClipboard, showAlert, getCreatorLink, getWebUser } from '../utils/web.js'

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
    Promise.all([
      getMissions({ creator_id: creatorId, status: 'active' }),
      getMissions({ creator_id: creatorId, status: 'completed' })
    ])
      .then(([active, completed]) => {
        const all = [...active, ...completed]
        setMissions(all)
        if (all.length > 0) setCreator(all[0].creator)
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
  const totalRaised = missions.reduce((s, m) => s + (parseFloat(m.current_ton) || 0), 0).toFixed(2)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">Creator</span>
      </div>
      <div className="page" style={{ paddingTop: 12 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', marginBottom: 20, paddingBottom: 20,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {creator
            ? <Avatar user={creator} size={72} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-secondary)' }} />
          }
          <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 12 }}>
            {creator?.first_name}{creator?.last_name ? ` ${creator.last_name}` : ''}
          </h1>
          {creator?.username && (
            <div style={{ fontSize: 14, color: 'var(--text-hint)', marginTop: 2 }}>@{creator.username}</div>
          )}

          <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{active.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>Live</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{completed.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>Completed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>${totalRaised}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>Raised</div>
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
                ✉️ Request
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {completed.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['active', 'completed'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 16px', borderRadius: 99,
                  background: tab === t ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: tab === t ? 'white' : 'var(--text-hint)',
                  fontWeight: tab === t ? 700 : 400,
                  fontSize: 13, border: 'none', cursor: 'pointer'
                }}
              >
                {t === 'active' ? `Live (${active.length})` : `Completed (${completed.length})`}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="spinner" />}

        {!loading && missions.length === 0 && (
          <div className="empty">
            <div className="icon">🌱</div>
            <div>No missions yet</div>
          </div>
        )}

        {(tab === 'active' ? active : completed).map(m => (
          <div key={m.id} style={{ opacity: m.status === 'completed' ? 0.7 : 1 }}>
            <MissionCard mission={m} />
          </div>
        ))}
      </div>
    </div>
  )
}
