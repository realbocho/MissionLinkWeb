import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMission, useMissionProgress } from '../hooks/useMission.js'
import ProgressBar from '../components/ProgressBar.jsx'
import Avatar from '../components/Avatar.jsx'
import { createPledge, confirmPledge, cancelPledge, expireMission } from '../utils/api.js'
import { showAlert, showConfirm, getMissionLink, getCreatorLink, copyToClipboard, getWebUser, formatAmount, PLATFORM_OPENCHAT, KAKAOPAY_GUIDE } from '../utils/web.js'
import { isLoggedIn } from '../utils/auth.js'

const FEE_RATE = 0.10
const STATUS_TEXT = { active: '진행 중', completed: '목표 달성! 🎉', expired: '만료됨' }
const STATUS_BADGE = { active: 'badge-active', completed: 'badge-completed', expired: 'badge-cancelled' }

// 수수료 안내 위젯
function FeeNotice({ totalAmount }) {
  const fee = Math.round((totalAmount || 0) * FEE_RATE)
  return (
    <div style={{
      background: '#ef444411', border: '1px solid #ef444433',
      borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#ef4444', marginBottom: 6 }}>
        ⚠️ 만료 전 수수료 납부 필수
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.7 }}>
        총 후원 의향 금액 <b style={{ color: 'var(--text)' }}>{formatAmount(totalAmount || 0)}</b>의
        10%인 <b style={{ color: '#ef4444' }}>{formatAmount(fee)}</b>를
        아래 카카오 오픈채팅으로 납부 후 만료해주세요.<br />
        미납 확인 시 계정 이용이 제한될 수 있어요.
      </div>
      <a
        href={PLATFORM_OPENCHAT}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block', marginTop: 8,
          background: '#FEE500', color: '#000000CC',
          borderRadius: 8, padding: '7px 14px',
          fontSize: 12, fontWeight: 700, textDecoration: 'none'
        }}
      >
        💬 수수료 납부하러 가기
      </a>
    </div>
  )
}

// 후원 의향 폼
function PledgeForm({ mission, refetch }) {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const QUICK = [5000, 10000, 30000, 50000]

  const handlePledge = async () => {
    if (!isLoggedIn()) return navigate('/login')
    const parsed = parseInt(amount.replace(/,/g, ''))
    if (!parsed || parsed < 1000) return showAlert('최소 1,000원부터 후원 의향을 등록할 수 있어요')
    setLoading(true)
    try {
      await createPledge({ mission_id: mission.id, amount: parsed })
      showAlert('후원 의향이 등록됐어요! 💜\n오픈채팅방 링크는 알림으로 보내드릴게요.')
      setAmount('')
      setTimeout(refetch, 1000)
    } catch (e) {
      showAlert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="label">💜 후원 의향 등록</div>
      <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12, lineHeight: 1.6 }}>
        후원 의향을 등록하면 <b style={{ color: 'var(--text)' }}>오픈채팅방 링크</b>를 알림으로 보내드려요.
        오픈채팅방에서 카카오페이로 실제 송금해주세요.
      </p>

      {/* 빠른 금액 선택 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => setAmount(q.toLocaleString())}
            style={{
              padding: '7px 12px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
              background: amount === q.toLocaleString() ? 'var(--accent)' : 'var(--bg-secondary)',
              color: amount === q.toLocaleString() ? 'white' : 'var(--text-hint)',
              border: 'none', fontWeight: 600
            }}
          >
            {formatAmount(q)}
          </button>
        ))}
      </div>

      <input
        className="input"
        placeholder="직접 입력 (최소 1,000원)"
        value={amount}
        onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
        style={{ marginBottom: 10 }}
      />

      {/* 카카오페이 가이드 */}
      <div style={{
        fontSize: 12, color: 'var(--text-hint)', marginBottom: 12,
        padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, lineHeight: 1.6
      }}>
        💡 오픈채팅방에서 카카오페이로 송금하는 방법이 궁금하다면?{' '}
        <a href={KAKAOPAY_GUIDE} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', fontWeight: 600 }}>
          카카오페이 송금 가이드 →
        </a>
      </div>

      <button className="btn-primary" onClick={handlePledge} disabled={loading || !amount}>
        {loading ? '등록 중...' : '후원 의향 등록하기 💜'}
      </button>
    </div>
  )
}

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mission, loading, error, refetch } = useMission(id)
  const { pct, remaining, done } = useMissionProgress(mission)
  const webUser = getWebUser()
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [expireLoading, setExpireLoading] = useState(false)
  const isCreator = webUser && String(webUser.id) === String(mission?.creator_id)

  const handleShareMission = async () => {
    await copyToClipboard(getMissionLink(id))
    setShareMenuOpen(false)
    showAlert('미션 링크 복사됨! 📋')
  }

  const handleShareProfile = async () => {
    await copyToClipboard(getCreatorLink(mission.creator_id))
    setShareMenuOpen(false)
    showAlert('프로필 링크 복사됨! 📋')
  }

  const handleExpire = async () => {
    const confirmed = await showConfirm(
      `미션을 만료하기 전에!\n\n총 후원 의향 금액: ${formatAmount(mission.current_amount)}\n납부하셔야 할 수수료 (10%): ${formatAmount(Math.round(mission.current_amount * FEE_RATE))}\n\n수수료 납부 후 만료해주세요.\n미납 확인 시 계정이 정지될 수 있어요.\n\n납부를 완료하셨나요?`
    )
    if (!confirmed) return
    setExpireLoading(true)
    try {
      await expireMission(id)
      showAlert('미션이 만료됐어요.')
      refetch()
    } catch (e) {
      showAlert(e.message)
    } finally {
      setExpireLoading(false)
    }
  }

  const handleConfirmPledge = async (pledgeId) => {
    try {
      await confirmPledge(pledgeId)
      showAlert('입금 확인 완료!')
      refetch()
    } catch (e) { showAlert(e.message) }
  }

  const handleCancelPledge = async (pledgeId) => {
    const ok = await showConfirm('이 후원 의향을 취소할까요? 취소 알림이 후원자에게 전송돼요.')
    if (!ok) return
    try {
      await cancelPledge(pledgeId)
      refetch()
    } catch (e) { showAlert(e.message) }
  }

  if (loading) return <div style={{ padding: 32 }}><div className="spinner" /></div>
  if (error) return <div className="page"><div className="empty">❌ {error}</div></div>
  if (!mission) return null

  const pledges = mission.pledges || []
  const confirmedPledges = pledges.filter(p => p.status === 'confirmed')
  const pendingPledges = pledges.filter(p => p.status === 'pending')
  const myPledge = pledges.find(p => webUser && String(p.user_id || p.user?.id) === String(webUser.id))

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">미션</span>
      </div>

      <div className="page" style={{
        paddingTop: 12,
        opacity: mission.status === 'expired' ? 0.55 : 1,
        filter: mission.status === 'expired' ? 'grayscale(70%)' : 'none'
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <div onClick={() => navigate(`/creator/${mission.creator_id}`)} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <Avatar user={mission.creator} size={44} />
          </div>
          <div style={{ flex: 1 }}>
            <div onClick={() => navigate(`/creator/${mission.creator_id}`)}
              style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>
              {mission.creator?.nickname} ›
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{mission.title}</h1>
          </div>
          <span className={`badge ${STATUS_BADGE[mission.status]}`}>
            {STATUS_TEXT[mission.status]}
          </span>
        </div>

        {/* 진행률 */}
        <div className="card">
          <ProgressBar pct={pct} current={mission.current_amount} goal={mission.goal_amount} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{confirmedPledges.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>입금 확인</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{pendingPledges.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>확인 대기</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{formatAmount(remaining)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>남은 금액</div>
            </div>
          </div>
        </div>

        {/* 미션 내용 */}
        <div className="card">
          <div className="label">🎁 미션 내용 및 리워드</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{mission.description}</p>
          {mission.weighted && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-hint)' }}>
              💡 후원 금액이 클수록 당첨 확률이 높아요!
            </div>
          )}
        </div>

        {/* 오픈채팅방 안내 */}
        {mission.openchat_link && (
          <div style={{
            background: '#FEE50011', border: '1px solid #FEE50033',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>💬 오픈채팅방</div>
            <p style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6, marginBottom: 8 }}>
              후원 의향 등록 후 알림으로 오픈채팅방 링크를 보내드려요.
              오픈채팅방에서 카카오페이로 실제 송금해주세요.
            </p>
            <a href={KAKAOPAY_GUIDE} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              카카오페이 오픈채팅 송금 가이드 →
            </a>
          </div>
        )}

        {/* 면책 안내 */}
        <div style={{
          fontSize: 11, color: 'var(--text-hint)', lineHeight: 1.6,
          padding: '8px 12px', marginBottom: 12,
          background: 'var(--bg-secondary)', borderRadius: 8
        }}>
          ⚠️ 후원금 송금 및 미션 이행은 크리에이터와 팬 간의 약속이에요. 피해 발생 시 MissionLink는 책임지지 않으며, 해당 크리에이터에게 직접 문의해주세요.
        </div>

        {/* 이미 등록한 경우 */}
        {myPledge && myPledge.status !== 'cancelled' && (
          <div style={{
            background: '#8b5cf611', border: '1px solid #8b5cf633',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12,
            fontSize: 13
          }}>
            {myPledge.status === 'pending'
              ? `⏳ ${formatAmount(myPledge.amount)} 후원 의향 등록됨 · 입금 확인 대기 중`
              : `✅ ${formatAmount(myPledge.amount)} 입금 확인 완료`}
          </div>
        )}

        {/* 후원 의향 폼 */}
        {mission.status !== 'expired' && !isCreator && !myPledge && (
          <PledgeForm mission={mission} refetch={refetch} />
        )}

        {/* 달성 배너 — 진행 중일 때만 */}
        {done && mission.status === 'active' && (
          <div style={{
            background: 'linear-gradient(135deg, var(--accent)22, #ec489922)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: 16,
            textAlign: 'center', marginBottom: 12
          }}>
            <div style={{ fontSize: 32 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 17, marginTop: 4 }}>목표 달성!</div>
            <div style={{ fontSize: 13, color: 'var(--text-hint)', marginTop: 4 }}>
              초과 후원도 계속 받을 수 있어요
            </div>
          </div>
        )}
        {/* 크리에이터 전용 — 만료 버튼 + 수수료 안내 */}
        {isCreator && mission.status !== 'expired' && (
          <>
            <FeeNotice totalAmount={mission.current_amount} />
            <button
              className="btn-secondary"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: 12 }}
              onClick={handleExpire}
              disabled={expireLoading}
            >
              {expireLoading ? '처리 중...' : '미션 만료하기'}
            </button>
          </>
        )}

        {/* 공유 버튼 */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setShareMenuOpen(o => !o)} style={{ flex: 1 }}>
              🔗 공유하기
            </button>
            <button className="btn-secondary" onClick={() => navigate(`/creator/${mission.creator_id}`)} style={{ flex: 1 }}>
              👤 프로필 보기
            </button>
          </div>
          {shareMenuOpen && (
            <>
              <div onClick={() => setShareMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)', overflow: 'hidden', zIndex: 20,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}>
                {[
                  { icon: '🎯', title: '미션 링크 복사', desc: '이 미션 바로 열기', fn: handleShareMission },
                  { icon: '👤', title: '크리에이터 프로필 링크', desc: '모든 미션 보기', fn: handleShareProfile }
                ].map(item => (
                  <button key={item.title} onClick={item.fn} style={{
                    width: '100%', background: 'none', border: 'none',
                    padding: '14px 16px', textAlign: 'left', color: 'var(--text)',
                    fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 크리에이터 입금 확인 목록 */}
        {isCreator && pendingPledges.length > 0 && (
          <div className="card">
            <div className="label" style={{ marginBottom: 12 }}>⏳ 입금 확인 대기 ({pendingPledges.length})</div>
            {pendingPledges.map(p => (
              <div key={p.id} style={{
                display: 'flex', gap: 10, alignItems: 'center',
                paddingBottom: 12, marginBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Avatar user={p.user} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.user?.nickname}</div>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{formatAmount(p.amount)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleConfirmPledge(p.id)} style={{
                    background: 'var(--success)', color: 'white',
                    border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer'
                  }}>✓ 확인</button>
                  <button onClick={() => handleCancelPledge(p.id)} style={{
                    background: 'none', color: 'var(--danger)',
                    border: '1px solid var(--danger)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer'
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 후원자 목록 */}
        {confirmedPledges.length > 0 && (
          <div className="card">
            <div className="label" style={{ marginBottom: 12 }}>후원자 ({confirmedPledges.length})</div>
            {confirmedPledges.map(p => (
              <div key={p.id} style={{
                display: 'flex', gap: 10, alignItems: 'center',
                paddingBottom: 10, marginBottom: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Avatar user={p.user} size={32} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.user?.nickname}</div>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{formatAmount(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
