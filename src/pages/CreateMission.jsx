import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMission } from '../utils/api.js'
import { showAlert, PLATFORM_OPENCHAT } from '../utils/web.js'

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

export default function CreateMission() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', goal_amount: '',
    winner_count: '1', weighted: true, openchat_link: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim()) return showAlert('미션 제목을 입력해주세요')
    if (!form.description.trim()) return showAlert('미션 내용을 입력해주세요')
    if (!form.goal_amount || parseInt(form.goal_amount.replace(/,/g, '')) < 1000) return showAlert('목표 금액은 최소 1,000원이에요')
    setLoading(true)
    try {
      const mission = await createMission({
        title: form.title.trim(),
        description: form.description.trim(),
        goal_amount: parseInt(form.goal_amount.replace(/,/g, '')),
        winner_count: parseInt(form.winner_count) || 1,
        weighted: form.weighted,
        openchat_link: form.openchat_link.trim() || null,
      })
      navigate(`/mission/${mission.id}`)
    } catch (e) {
      showAlert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">미션 만들기</span>
      </div>
      <div className="page" style={{ paddingTop: 12 }}>

        {/* 주의사항 */}
        <div style={{
          background: '#8b5cf611', border: '1px solid #8b5cf633',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>⚠️ 미션 등록 시 주의사항</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.8 }}>
            • 실제로 이행할 수 있는 미션만 등록해주세요<br />
            • 허위 미션, 사기성 미션은 즉시 계정이 정지돼요<br />
            • 미션 이행 후 반드시 만료 처리 및 수수료를 납부해주세요
          </div>
        </div>

        {/* 수수료 안내 */}
        <div style={{
          background: '#ef444411', border: '1px solid #ef444433',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#ef4444', marginBottom: 4 }}>💰 플랫폼 수수료 안내</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.7 }}>
            MissionLink는 무료로 사용할 수 있어요.<br />
            단, 미션 이행 완료 후 만료 처리 시 총 후원금의 <b style={{ color: 'var(--text)' }}>10%</b>를
            플랫폼 수수료로 카카오 오픈채팅으로 납부해주셔야 해요.<br />
            <b style={{ color: '#ef4444' }}>미납 확인 시 계정 이용이 제한될 수 있어요.</b>
          </div>
          <a href={PLATFORM_OPENCHAT} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 8, background: '#FEE500', color: '#000000CC', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            💬 플랫폼 수수료 채팅방
          </a>
        </div>

        <div className="card">
          <div className="label">미션 제목</div>
          <input className="input" placeholder="예) 목표 달성 시 라이브 방송 진행!" value={form.title} onChange={e => set('title', e.target.value)} maxLength={80} />
        </div>

        <div className="card">
          <div className="label">미션 내용 및 리워드</div>
          <textarea className="input" placeholder="달성 시 어떤 미션을 이행할지, 후원자에게 어떤 혜택을 드리는지 자세히 적어주세요." value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
        </div>

        <div className="card">
          <div className="label">목표 금액 (원)</div>
          <input className="input" type="text" placeholder="예) 100,000" value={form.goal_amount}
            onChange={e => set('goal_amount', e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))} />
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>최소 1,000원 · 목표 초과 후원도 계속 받을 수 있어요</div>
        </div>

        <div className="card">
          <div className="label">오픈채팅방 링크</div>
          <input className="input" placeholder="https://open.kakao.com/o/xxxxxxxx" value={form.openchat_link} onChange={e => set('openchat_link', e.target.value)} />
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6, lineHeight: 1.6 }}>
            후원 의향 등록 시 팬에게 자동으로 발송돼요. 나중에 추가할 수도 있어요.<br />
            <a href="/guide/openchat"
              style={{ color: 'var(--accent)', fontWeight: 600 }}>
              오픈채팅방 만드는 법 가이드 →
            </a>
          </div>
        </div>

        <div className="card">
          <div className="label">당첨자 수</div>
          <input className="input" type="number" placeholder="1" value={form.winner_count} onChange={e => set('winner_count', e.target.value)} min="0" />
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>0으로 설정하면 모든 후원자가 당첨돼요</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>가중 추첨</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>후원 금액이 클수록 당첨 확률 상승</div>
            </div>
            <Toggle checked={form.weighted} onChange={e => set('weighted', e.target.checked)} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '생성 중...' : '🚀 미션 시작하기'}
        </button>
      </div>
    </div>
  )
}
