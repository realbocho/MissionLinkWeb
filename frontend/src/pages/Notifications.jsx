import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead, markOneRead } from '../utils/api.js'

const TYPE_ICON = {
  mission_request:  '📬',
  request_accepted: '✅',
  request_rejected: '❌',
  mission_completed:'🎉',
  winner_selected:  '🏆',
  pledge_confirmed: '✅',
  pledge_cancelled: '❌',
  openchat_link:    '💬',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  if (h < 24) return `${h}시간 전`
  return `${d}일 전`
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleClick = (notif) => {
    // 읽음처리는 백그라운드로 (기다리지 않음)
    if (!notif.is_read) {
      markOneRead(notif.id).catch(console.error)
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
    }
    // 즉시 이동
    if (notif.link) {
      if (notif.link.startsWith('http')) {
        window.open(notif.link, '_blank')
      } else {
        navigate(notif.link)
      }
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">알림</span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="page" style={{ paddingTop: 12 }}>
        {loading && <div className="spinner" />}

        {!loading && notifications.length === 0 && (
          <div className="empty">
            <div className="icon">🔔</div>
            <div>알림이 없어요</div>
            <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-hint)' }}>
              미션 관련 소식이 여기에 표시돼요
            </div>
          </div>
        )}

        {notifications.map(notif => (
          <div
            key={notif.id}
            onClick={() => handleClick(notif)}
            style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '14px 16px',
              background: notif.is_read ? 'var(--bg-card)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 8,
              cursor: notif.link ? 'pointer' : 'default',
              border: notif.is_read
                ? '1px solid transparent'
                : '1px solid rgba(139,92,246,0.3)',
              position: 'relative'
            }}
          >
            {!notif.is_read && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)'
              }} />
            )}
            <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
              {TYPE_ICON[notif.type] || '🔔'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: notif.is_read ? 400 : 700, fontSize: 14, marginBottom: 3 }}>
                {notif.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-hint)', lineHeight: 1.5 }}>
                {notif.body}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 6, opacity: 0.7 }}>
                {timeAgo(notif.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
