-- ============================================
-- AI Legal Assistant - Supabase 전체 스키마
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 사용자 프로필 (Supabase Auth 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 세션
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('civil', 'criminal', 'family', 'labor', 'realestate')),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  precedents JSONB,
  llm_provider TEXT DEFAULT 'gemini',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM 사용량 추적
CREATE TABLE IF NOT EXISTS llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- 판례 캐시 (API 호출 최소화, 24시간 TTL)
CREATE TABLE IF NOT EXISTS precedent_cache (
  id TEXT PRIMARY KEY,
  case_number TEXT,
  court TEXT,
  decided_at TEXT,
  case_name TEXT,
  summary TEXT,
  full_text TEXT,
  category TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- ============================================
-- 2. RLS (Row Level Security) 활성화
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE precedent_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS 정책 — 사용자별 데이터 격리
-- ============================================

-- profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- chat_sessions
CREATE POLICY "Users can read own sessions"
  ON chat_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- messages
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );

-- precedent_cache (공개 읽기 — 캐시는 모든 사용자 공유)
CREATE POLICY "Anyone can read precedent cache"
  ON precedent_cache FOR SELECT USING (true);

-- ============================================
-- 4. RLS 정책 — 서비스 역할 (백엔드 서버용)
-- ============================================

CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to sessions"
  ON chat_sessions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage precedent cache"
  ON precedent_cache FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage llm usage"
  ON llm_usage FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 5. 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
  ON chat_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_session
  ON messages(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_precedent_cache_expires
  ON precedent_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_llm_usage_date
  ON llm_usage(called_at DESC);

-- ============================================
-- 6. 트리거: 프로필 자동 생성 (회원가입 시)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. 트리거: updated_at 자동 갱신
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
