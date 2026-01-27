-- Проверка и создание таблицы tenants
-- Выполните этот SQL ПЕРЕД AI_STATUS_FUNCTION.sql, если таблица tenants не существует

-- Создаём таблицу tenants, если её нет
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  plan text DEFAULT 'MINI' CHECK (plan IN ('MINI', 'PRO', 'TEAM')),
  max_users integer DEFAULT 3,
  access_expires_at timestamptz,
  ai_status text DEFAULT 'empty' CHECK (ai_status IN ('empty', 'indexing', 'ready', 'needs_reindex')),
  ai_last_indexed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Включаем RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Политики доступа: пользователь может читать и обновлять только свой tenant
DROP POLICY IF EXISTS "Users can read own tenant" ON tenants;
CREATE POLICY "Users can read own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = public.current_tenant_id());

DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
CREATE POLICY "Users can update own tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (id = public.current_tenant_id())
  WITH CHECK (id = public.current_tenant_id());

-- Создаём таблицу tenant_members, если её нет
CREATE TABLE IF NOT EXISTS tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Включаем RLS для tenant_members
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Политики для tenant_members
DROP POLICY IF EXISTS "Users can read own membership" ON tenant_members;
CREATE POLICY "Users can read own membership"
  ON tenant_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own membership" ON tenant_members;
CREATE POLICY "Users can insert own membership"
  ON tenant_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS tenant_members_user_id_idx ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS tenant_members_tenant_id_idx ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS tenants_ai_status_idx ON tenants(ai_status);

-- Комментарии
COMMENT ON TABLE tenants IS 'Таблица тенантов для мультитенантной архитектуры';
COMMENT ON COLUMN tenants.ai_status IS 'Статус AI индексации: empty, indexing, ready, needs_reindex';
COMMENT ON COLUMN tenants.ai_last_indexed_at IS 'Время последней успешной индексации';
