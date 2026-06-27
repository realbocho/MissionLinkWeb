import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import Avatar from '../components/Avatar.jsx'
import { showAlert } from '../utils/web.js'

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 99,
        background: checked ? 'var(--accent)' : 'var(--text-hint)',
        transition: 'background 0.2s'
      }}>
        <span style={{
          position: 'absolute', top: 3, left: checked ? 22 : 3,
          width: 20, height: 20, background: 'white', borderRadius: '50%',
          transition: 'left 0.2s'
        }} />
      </span>
    </label>
  )
}

export default function IncomingRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [acceptForm, setAcceptForm] = useState({ goal_ton: '', winner_count: '', weighted: true })

  useEffect(() => {
    api.get('/requests')
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleReject = async (id) => {
    try {
      await api.patch(`/requests/${id}`, { action: 'reject' })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    } catch (e) {
      showAlert(e.message)
    }
  }

  const handleAccept = async (id) => {
    if (!acceptForm.goal_ton || parseFloat(acceptForm.goal_ton) <= 0) {
      return showAlert('Please set a goal amount in USD')
    }
    try {
      const { mission } = await api.patch(`/requests/${id}`, {
        action: 'accept',
        goal_ton: parseFloat(acceptForm.goal_ton),
        winner_count: acceptForm.winner_count === '' ? 1 : parseInt(acceptForm.winner_count),
        weighted: acceptForm.weighted
      })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted', mission_id: mission.id } : r))
      setAccepting(null)
      showAlert('✅ Mission created! Requester will see it on your profile.')
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
        <span className="topbar-title">Mission Requests</span>
      </div>

      <div className="page" style={{ paddingTop: 12 }}>
        <p style={{ color: 'var(--text-hint)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          Fans want you to do something — accept and set a funding goal!
        </p>

        {loading && <div className="spinner" />}

        {!loading && requests.length === 0 && (
          <div className="empty">
            <div className="icon">📭</div>
            <div>No requests yet</div>
            <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-hint)' }}>
              Share your profile link so fans can send requests!
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <div className="label" style={{ marginBottom: 10 }}>Pending ({pending.length})</div>
            {pending.map(req => (
              <div key={req.id} className="card">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <Avatar user={req.requester} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                      {req.requester?.username ? `@${req.requester.username}` : req.requester?.first_name}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 2 }}>{req.content}</p>
                  </div>
                </div>

                {accepting === req.id ? (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 10 }}>Set mission details:</div>

                    <div style={{ marginBottom: 8 }}>
                      <div className="label">Goal Amount (USD $)</div>
                      <input
                        className="input"
                        type="number"
                        placeholder="e.g. 50"
                        value={acceptForm.goal_ton}
                        onChange={e => setAcceptForm(f => ({ ...f, goal_ton: e.target.value }))}
                        min="1" step="1"
                        autoFocus
                      />
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div className="label">Number of Winners</div>
                      <input
                        className="input"
                        type="number"
                        placeholder="1 (0 = all supporters)"
                        value={acceptForm.winner_count}
                        onChange={e => setAcceptForm(f => ({ ...f, winner_count: e.target.value }))}
                        min="0"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 13 }}>Weighted Draw</div>
                      <Toggle
                        checked={acceptForm.weighted}
                        onChange={e => setAcceptForm(f => ({ ...f, weighted: e.target.checked }))}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={() => handleAccept(req.id)} style={{ flex: 2 }}>
                        ✅ Accept & Launch
                      </button>
                      <button className="btn-secondary" onClick={() => setAccepting(null)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={() => { setAccepting(req.id); setAcceptForm({ goal_ton: '', winner_count: '', weighted: true }) }}
                      style={{ flex: 2 }}
                    >
                      ✅ Accept
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleReject(req.id)}
                      style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {handled.length > 0 && (
          <>
            <div className="label" style={{ marginTop: 16, marginBottom: 10 }}>Handled</div>
            {handled.map(req => (
              <div key={req.id} className="card" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Avatar user={req.requester} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                      {req.requester?.username ? `@${req.requester.username}` : req.requester?.first_name}
                      <span style={{
                        marginLeft: 8,
                        color: req.status === 'accepted' ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 600
                      }}>
                        {req.status === 'accepted' ? '✓ Accepted' : '✕ Rejected'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, marginTop: 2, color: 'var(--text-hint)' }}>{req.content}</p>
                  </div>
                  {req.status === 'accepted' && req.mission_id && (
                    <button
                      onClick={() => navigate(`/mission/${req.mission_id}`)}
                      style={{ background: 'none', color: 'var(--accent)', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      View →
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
