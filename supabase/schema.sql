-- AutoShiftApp Database Schema
-- Run this in Supabase SQL Editor

-- =========================================
-- ability_definitions: 能力種別の定義
-- =========================================
CREATE TABLE IF NOT EXISTS ability_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- members: スタッフ情報
-- =========================================
CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- member_abilities: メンバー×能力スコア（EAV）
-- =========================================
CREATE TABLE IF NOT EXISTS member_abilities (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  ability_definition_id UUID NOT NULL REFERENCES ability_definitions(id) ON DELETE CASCADE,
  score                 INT  NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, ability_definition_id)
);

-- =========================================
-- shifts: 月単位のシフト
-- =========================================
CREATE TABLE IF NOT EXISTS shifts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year       INT  NOT NULL,
  month      INT  NOT NULL CHECK (month >= 1 AND month <= 12),
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

-- =========================================
-- shift_day_configs: 日ごとの設定
-- =========================================
CREATE TABLE IF NOT EXISTS shift_day_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id      UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  day           INT  NOT NULL CHECK (day >= 1 AND day <= 31),
  required_count INT NOT NULL DEFAULT 2 CHECK (required_count >= 0),
  max_count     INT CHECK (max_count >= 0),
  is_closed     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, day)
);

-- =========================================
-- shift_assignments: 日ごとの出勤割り当て
-- =========================================
CREATE TABLE IF NOT EXISTS shift_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id         UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  day              INT  NOT NULL CHECK (day >= 1 AND day <= 31),
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  is_auto_assigned BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, day, member_id)
);

-- =========================================
-- Indexes
-- =========================================
CREATE INDEX IF NOT EXISTS idx_member_abilities_member_id ON member_abilities(member_id);
CREATE INDEX IF NOT EXISTS idx_shift_day_configs_shift_id ON shift_day_configs(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_day ON shift_assignments(shift_id, day);

-- =========================================
-- Initial data: ability_definitions
-- =========================================
INSERT INTO ability_definitions (key, label, sort_order) VALUES
  ('business_understanding', '業務理解度', 1),
  ('store_management', 'お店を回す能力', 2),
  ('service_enthusiasm', '接客の積極性', 3)
ON CONFLICT (key) DO NOTHING;

-- =========================================
-- shift_member_requests: 出勤・休み希望
-- =========================================
CREATE TABLE IF NOT EXISTS shift_member_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id   UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day        INT  NOT NULL CHECK (day >= 1 AND day <= 31),
  request    TEXT NOT NULL CHECK (request IN ('want_work', 'want_off')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, member_id, day)
);
CREATE INDEX IF NOT EXISTS idx_shift_member_requests_shift_id
  ON shift_member_requests(shift_id);

-- =========================================
-- shift_ability_weights: 能力重み付け
-- =========================================
CREATE TABLE IF NOT EXISTS shift_ability_weights (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id              UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  ability_definition_id UUID NOT NULL REFERENCES ability_definitions(id) ON DELETE CASCADE,
  weight                NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 3),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, ability_definition_id)
);

-- =========================================
-- Row Level Security (RLS) - disable for dev
-- =========================================
ALTER TABLE ability_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_abilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_day_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_member_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_ability_weights DISABLE ROW LEVEL SECURITY;
