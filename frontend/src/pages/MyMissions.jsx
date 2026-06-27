import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMissions, getMe } from '../utils/api.js'
import api from '../utils/api.js'
import MissionCard from '../components/MissionCard.jsx'
import { getWebUser, copyToClipboard, showAlert, getCreatorLink } from '../utils/web.js'
import { removeToken } from '../utils/auth.js'

export default function MyMissions() {
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const webUser = getWebUser()

  useEffect(() => {
    Promise.all([
      getMissions({ creator_id: webUser?.id }),
      api.get('/requests').catch(() => [])
    ])
      .then(([m, reqs]) => {
        setMissions(m)
        setPendingCount(Array.isArray(reqs) ? reqs.filter(r => r.status === 'pending').length : 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => { removeToken(); navigate('/login', { replace: true }) }

  const active = missions.filter(m => m.status === 'active')
  const completed = missions.filter(m => m.status === 'completed')
  const expired = missions.filter(m => m.status === 'expired')

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>내 미션</h1>
          <p style={{ color: 'var(--text-hint)', fontSize: 13 }}>{webUser?.nickname}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button onClick={() => setShareOpen(o => !o)} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>
            🔗 공유
          </button>
          {shareOpen && (
            <>
              <div onClick={() => setShareOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', zIndex: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <button onClick={async () => { await copyToClipboard(getCreatorLink(webUser.id)); setShareOpen(false); showAlert('프로필 링크 복사됨! 📋') }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', textAlign: 'left', color: 'var(--text)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>프로필 링크 복사</div>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 1 }}>내 모든 미션 페이지</div>
                  </div>
                </button>
              </div>
            </>
          )}
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'var(--text-hint)', fontSize: 13 }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 미션 요청 배너 */}
      <div onClick={() => navigate('/requests')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: pendingCount > 0 ? '#8b5cf611' : 'var(--bg-secondary)', border: `1px solid ${pendingCount > 0 ? '#8b5cf644' : 'rgba(255,255,255,0.06)'}`, marginBottom: 16, cursor: 'pointer' }}>
        <span style={{ fontSize: 22 }}>📬</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>미션 요청</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{pendingCount > 0 ? `${pendingCount}개의 새 요청` : '새 요청 없음'}</div>
        </div>
        {pendingCount > 0 && <div style={{ background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 700, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</div>}
        <span style={{ color: 'var(--text-hint)', fontSize: 18 }}>›</span>
      </div>

      {loading && <div className="spinner" />}

      {!loading && missions.length === 0 && (
        <div className="empty">
          <div className="icon">📭</div>
          <div>미션이 없어요</div>
          <button onClick={() => navigate('/create')} className="btn-primary" style={{ marginTop: 16, width: 'auto', padding: '12px 24px' }}>첫 미션 만들기</button>
        </div>
      )}

      {active.length > 0 && <><div className="label" style={{ marginBottom: 8 }}>진행 중</div>{active.map(m => <MissionCard key={m.id} mission={m} />)}</>}
      {completed.length > 0 && <><div className="label" style={{ marginTop: 8, marginBottom: 8 }}>목표 달성</div>{completed.map(m => <MissionCard key={m.id} mission={m} />)}</>}
      {expired.length > 0 && <><div className="label" style={{ marginTop: 8, marginBottom: 8 }}>만료됨</div>{expired.map(m => <MissionCard key={m.id} mission={m} />)}</>}
    </div>
  )
}
