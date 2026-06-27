-- ============================================
-- MissionLink Schema v3 (카카오 로그인 + 후원 의향)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- 카카오 유저 ID
  nickname TEXT NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,             -- 미션 내용 + 리워드
  goal_amount BIGINT NOT NULL,           -- 목표 금액 (원)
  current_amount BIGINT NOT NULL DEFAULT 0, -- 현재 후원 의향 합계
  openchat_link TEXT,                    -- 카카오 오픈채팅방 링크
  winner_count INT NOT NULL DEFAULT 1,
  weighted BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired')),
  completed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pledges (    -- 후원 의향
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL,              -- 희망 후원 금액 (원)
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',    -- 의향 등록됨
      'confirmed',  -- 크리에이터가 입금 확인
      'cancelled'   -- 48시간 미확인으로 자동 취소
    )),
  openchat_sent BOOLEAN DEFAULT FALSE, -- 오픈채팅 링크 알림 발송 여부
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mission_id, user_id)          -- 미션당 1회 의향 등록
);

CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES users(id),
  requester_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  mission_id UUID REFERENCES missions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN (
    'mission_request',
    'request_accepted',
    'request_rejected',
    'mission_completed',
    'winner_selected',
    'pledge_confirmed',
    'pledge_cancelled',
    'openchat_link'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_missions_creator ON missions(creator_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_pledges_mission ON pledges(mission_id);
CREATE INDEX IF NOT EXISTS idx_pledges_user ON pledges(user_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_created ON pledges(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON users FOR ALL USING (true);
CREATE POLICY "service_role_all" ON missions FOR ALL USING (true);
CREATE POLICY "service_role_all" ON pledges FOR ALL USING (true);
CREATE POLICY "service_role_all" ON winners FOR ALL USING (true);
CREATE POLICY "service_role_all" ON mission_requests FOR ALL USING (true);
CREATE POLICY "service_role_all" ON notifications FOR ALL USING (true);

-- 미션 금액 업데이트 함수
CREATE OR REPLACE FUNCTION update_mission_amount(p_mission_id UUID, p_delta BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE missions
  SET
    current_amount = current_amount + p_delta,
    status = CASE
      WHEN current_amount + p_delta >= goal_amount AND status = 'active'
      THEN 'completed'
      ELSE status
    END,
    completed_at = CASE
      WHEN current_amount + p_delta >= goal_amount AND status = 'active' AND completed_at IS NULL
      THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_mission_id;
END;
$$ LANGUAGE plpgsql;
