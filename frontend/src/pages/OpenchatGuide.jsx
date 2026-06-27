import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    num: 1,
    title: '오픈채팅 탭 이동',
    desc: '카카오톡 앱을 실행하고 하단 메뉴에서 오픈채팅(말풍선 모양) 탭을 선택해요.'
  },
  {
    num: 2,
    title: '채팅방 만들기 실행',
    desc: '우측 상단 또는 하단의 채팅방 아이콘(플러스 또는 말풍선 모양)을 터치해요.'
  },
  {
    num: 3,
    title: '1:1 채팅 선택',
    desc: '생성할 채팅방 유형에서 1:1을 선택해요.'
  },
  {
    num: 4,
    title: '기본 정보 입력',
    desc: '오픈채팅방의 이름, 프로필 커버 이미지, 해시태그 등을 설정해요.',
    tip: '개인 프라이버시 보호가 필요하다면 본명 대신 가명(닉네임)을 사용하고, 카카오 프렌즈 기본 프로필로만 참여하도록 설정할 수 있어요.'
  },
  {
    num: 5,
    title: '검색 및 참여 허용 설정',
    desc: '오픈채팅 검색 허용 여부를 켜거나 끄고, 완료 버튼을 눌러 채팅방을 생성해요.'
  }
]

export default function OpenchatGuide() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
        <span className="topbar-title">오픈채팅방 만드는 법</span>
      </div>

      <div className="page" style={{ paddingTop: 12 }}>
        <div style={{
          background: '#FEE50011', border: '1px solid #FEE50044',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 20
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>💬 1:1 오픈채팅 만들기</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6 }}>
            오픈채팅방을 만들면 팬들이 카카오페이로 후원금을 송금할 수 있어요.
            개인 계좌번호나 연락처 노출 없이 안전하게 후원받을 수 있어요.
          </div>
        </div>

        {STEPS.map((step, i) => (
          <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, flexShrink: 0
            }}>
              {step.num}
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-hint)', lineHeight: 1.7 }}>{step.desc}</div>
              {step.tip && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: 'var(--bg-secondary)', borderRadius: 8,
                  fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6
                }}>
                  💡 {step.tip}
                </div>
              )}
              {i < STEPS.length - 1 && (
                <div style={{
                  marginTop: 16, borderLeft: '2px dashed rgba(255,255,255,0.1)',
                  height: 8, marginLeft: -28
                }} />
              )}
            </div>
          </div>
        ))}

        <div style={{
          background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginTop: 8
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🔗 링크 공유하기</div>
          <div style={{ fontSize: 13, color: 'var(--text-hint)', lineHeight: 1.7 }}>
            생성된 채팅방의 링크나 QR코드를 복사해서 팬들에게 전달하면 바로 1:1 오픈채팅을 시작할 수 있어요.
            미션 등록 시 이 링크를 입력하면 후원 의향 등록한 팬에게 자동으로 발송돼요!
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate(-1)}>
          확인했어요 ✓
        </button>
      </div>
    </div>
  )
}
