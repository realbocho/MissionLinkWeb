import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isLoggedIn } from '../utils/auth.js'
import { getNotifications } from '../utils/api.js'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const loggedIn = isLoggedIn()
  const [unread, setUnread] = useState(0)

  // 로그인 상태일 때만 미읽은 알림 수 가져오기
  useEffect(() => {
    if (!loggedIn) return
    getNotifications()
      .then(list => setUnread(list.filter(n => !n.is_read).length))
      .catch(() => {})

    // 30초마다 갱신
    const interval = setInterval(() => {
      getNotifications()
        .then(list => setUnread(list.filter(n => !n.is_read).length))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [loggedIn])

  // 알림 페이지 방문 시 뱃지 초기화
  useEffect(() => {
    if (pathname === '/notifications') setUnread(0)
  }, [pathname])

  const tabs = [
    { path: '/', icon: '🔍', label: '탐색' },
    { path: '/create', icon: '✨', label: '만들기' },
    loggedIn
      ? { path: '/notifications', icon: '🔔', label: '알림', badge: unread }
      : null,
    loggedIn
      ? { path: '/my', icon: '👤', label: '내 미션' }
      : { path: '/login', icon: '🔑', label: '로그인' },
  ].filter(Boolean)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', maxWidth: 640, margin: '0 auto' }}>
        {tabs.map(tab => {
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1, background: 'none', border: 'none',
                padding: '10px 0 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: active ? 'var(--accent)' : 'var(--text-hint)',
                transition: 'color 0.15s', cursor: 'pointer',
              }}
            >
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 22 }}>{tab.icon}</span>
                {tab.badge > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -6,
                    background: 'var(--accent)',
                    color: 'white', fontSize: 10, fontWeight: 700,
                    minWidth: 16, height: 16, borderRadius: 99,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    lineHeight: 1
                  }}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
