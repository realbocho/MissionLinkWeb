import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import Avatar from '../components/Avatar.jsx'
import { showAlert } from '../utils/web.js'

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: checked ? 'var(--accent)' : 'var(--text-hint)', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 22 : 3, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
      </span>
    </label>
  )
}

export default function IncomingRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [acceptForm, setAcceptForm] = useState({ goal_amount: '', winner_count: '', weighted: true, contact_email: '' })

  useEffect(() => {
    api.get('/requests')
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleReject = async (id) => {
    try {
      await api.patch('/requests/handle', { request_id: id, action: 'reject' })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    } catch (e) {
      showAlert(e.message)
    }
  }

  const handleAccept = async (id) => {
    const parsed = parseInt(acceptForm.goal_amount.replace(/,/g, ''))
    if (!parsed || parsed < 1000) {
      return showAlert('목표 금액을 입력해주세요 (최소 1,000원)')
    }
    try {
      const { mission } = await api.patch('/requests/handle', {
        request_id: id,
        action: 'accept',
        goal_ton: parsed,
        winner_count: acceptForm.winner_count === '' ? 1 : parseInt(acceptForm.winner_count),
        weighted: acceptForm.weighted,
        contact_email: acceptForm.contact_email.trim() || null
      })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted', mission_id: mission.id } : r))
      setAccepting(null)
      showAlert('✅ 미션이 생성됐어요! 요청자의 프로필에서 확인할 수 있어요.')
    } catch (e) {
      showAlert(e.message)
    }
  }

  const pending = requests.filter(r => r.status === 'pending')
  const handled = requests.filter(r => r.status !== 'pending')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">미션 요청</span>
      </div>

      <div className="page" style={{ paddingTop: 12 }}>
        <p style={{ color: 'var(--text-hint)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          팬들이 원하는 미션을 요청했어요. 수락하면 바로 미션이 생성돼요!
        </p>

        {loading && <div className="spinner" />}

        {!loading && requests.length === 0 && (
          <div className="empty">
            <div className="icon">📭</div>
            <div>아직 요청이 없어요</div>
            <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-hint)' }}>
              프로필 링크를 공유해서 팬들의 요청을 받아보세요!
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <div className="label" style={{ marginBottom: 10 }}>대기 중 ({pending.length})</div>
            {pending.map(req => (
              <div key={req.id} className="card">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <Avatar user={req.requester} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                      {req.requester?.nickname || '익명'}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 2 }}>{req.content}</p>
                  </div>
                </div>

                {accepting === req.id ? (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 10 }}>미션 세부 설정:</div>

                    <div style={{ marginBottom: 8 }}>
                      <div className="label">목표 금액 (원)</div>
                      <input
                        className="input"
                        type="text"
                        placeholder="예) 50,000"
                        value={acceptForm.goal_amount}
                        onChange={e => setAcceptForm(f => ({ ...f, goal_amount: e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') }))}
                        autoFocus
                      />
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div className="label">당첨자 연락용 이메일</div>
                      <input
                        className="input"
                        type="email"
                        placeholder="예) creator@email.com"
                        value={acceptForm.contact_email}
                        onChange={e => setAcceptForm(f => ({ ...f, contact_email: e.target.value }))}
                      />
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 4 }}>
                        추첨 당첨자에게 공개돼요
                      </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div className="label">당첨자 수</div>
                      <input
                        className="input"
                        type="number"
                        placeholder="1 (0 = 전원 당첨)"
                        value={acceptForm.winner_count}
                        onChange={e => setAcceptForm(f => ({ ...f, winner_count: e.target.value }))}
                        min="0"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 13 }}>가중 추첨</div>
                        <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>후원 금액이 클수록 당첨 확률 상승</div>
                      </div>
                      <Toggle
                        checked={acceptForm.weighted}
                        onChange={e => setAcceptForm(f => ({ ...f, weighted: e.target.checked }))}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={() => handleAccept(req.id)} style={{ flex: 2 }}>
                        ✅ 수락하고 미션 생성
                      </button>
                      <button className="btn-secondary" onClick={() => setAccepting(null)} style={{ flex: 1 }}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={() => { setAccepting(req.id); setAcceptForm({ goal_amount: '', winner_count: '', weighted: true }) }}
                      style={{ flex: 2 }}
                    >
                      ✅ 수락
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleReject(req.id)}
                      style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      ✕ 거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {handled.length > 0 && (
          <>
            <div className="label" style={{ marginTop: 16, marginBottom: 10 }}>처리 완료</div>
            {handled.map(req => (
              <div key={req.id} className="card" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Avatar user={req.requester} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                      {req.requester?.nickname || '익명'}
                      <span style={{
                        marginLeft: 8,
                        color: req.status === 'accepted' ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 600
                      }}>
                        {req.status === 'accepted' ? '✓ 수락됨' : '✕ 거절됨'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, marginTop: 2, color: 'var(--text-hint)' }}>{req.content}</p>
                  </div>
                  {req.status === 'accepted' && req.mission_id && (
                    <button
                      onClick={() => navigate(`/mission/${req.mission_id}`)}
                      style={{ background: 'none', color: 'var(--accent)', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      보기 →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
