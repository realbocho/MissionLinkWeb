import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import { showAlert } from '../utils/web.js'

export default function RequestMission() {
  const { creatorId } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return showAlert('요청 내용을 입력해주세요')
    setLoading(true)
    try {
      await api.post('/requests', { creator_id: creatorId, content: content.trim() })
      showAlert('🎉 요청이 전송됐어요!\n크리에이터가 검토 후 목표 금액을 설정할 거예요.')
      navigate(-1)
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
        <span className="topbar-title">미션 요청하기</span>
      </div>

      <div className="page" style={{ paddingTop: 12 }}>

        {/* 주의사항 */}
        <div style={{
          background: '#8b5cf611', border: '1px solid #8b5cf633',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>⚠️ 미션 요청 시 주의사항</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.8 }}>
            • 크리에이터가 실제로 이행할 수 있는 요청만 해주세요<br />
            • 불쾌하거나 부적절한 요청은 즉시 계정이 정지돼요<br />
            • 허위 후원 의향 등록 시 계정 이용이 제한돼요
          </div>
        </div>

        <div style={{ color: 'var(--text-hint)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          원하는 미션을 요청해보세요. 크리에이터가 수락하면 목표 금액이 설정돼요!
        </div>

        <div className="card">
          <div className="label">어떤 미션을 원하시나요?</div>
          <textarea
            className="input"
            placeholder="라이브 쿡방을 진행해주세요! / 비하인드 영상을 공개해주세요! / 팬이 신청한 노래를 불러주세요! 등등.."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            maxLength={300}
            autoFocus
          />
          <div style={{
            textAlign: 'right', fontSize: 12,
            color: content.length > 260 ? 'var(--danger)' : 'var(--text-hint)',
            marginTop: 6
          }}>
            {content.length}/300
          </div>
        </div>

        <div style={{
          padding: '12px 14px', background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)', marginBottom: 16,
          fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6
        }}>
          💡 크리에이터가 수락 시 목표 금액과 리워드를 직접 설정해요.
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
        >
          {loading ? '전송 중...' : '📬 요청 보내기'}
        </button>
      </div>
    </div>
  )
}
