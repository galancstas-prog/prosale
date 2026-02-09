-- ============================================
-- WhatsApp Integration Database Setup
-- ProSale Multi-Tenant WhatsApp Module
-- ============================================

-- ============================================
-- 1. WHATSAPP SESSIONS TABLE
-- Хранит сессии WhatsApp для каждого tenant'а
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Session info
  session_name text NOT NULL DEFAULT 'Основной',
  phone_number text, -- номер после подключения
  status text NOT NULL DEFAULT 'disconnected', -- disconnected, qr_pending, connected
  
  -- Session data (encrypted JSON from Baileys)
  session_data jsonb,
  
  -- Connection info
  last_connected_at timestamptz,
  qr_code text, -- текущий QR для подключения
  qr_expires_at timestamptz,
  
  -- Settings
  auto_assign boolean DEFAULT true, -- автораспределение новых чатов
  welcome_message text, -- автоответ на первое сообщение (опционально)
  ai_suggestions_enabled boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. WHATSAPP CHATS TABLE
-- Хранит все чаты
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Contact info
  remote_jid text NOT NULL, -- WhatsApp JID (phone@s.whatsapp.net)
  contact_phone text NOT NULL,
  contact_name text,
  contact_avatar_url text,
  
  -- Assignment
  assigned_to uuid REFERENCES auth.users(id), -- кому назначен чат
  assigned_at timestamptz,
  
  -- Status
  status text NOT NULL DEFAULT 'open', -- open, pending, resolved, archived
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Tags (для категоризации)
  tags text[] DEFAULT '{}',
  
  -- Last message preview
  last_message_text text,
  last_message_at timestamptz,
  last_message_direction text, -- in, out
  
  -- Unread count
  unread_count integer DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one chat per contact per session
  UNIQUE(session_id, remote_jid)
);

-- ============================================
-- 3. WHATSAPP MESSAGES TABLE
-- Хранит все сообщения
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Message info
  wa_message_id text, -- ID сообщения в WhatsApp
  direction text NOT NULL, -- in, out
  
  -- Content
  content_type text NOT NULL DEFAULT 'text', -- text, image, video, audio, document, sticker, location
  content_text text,
  content_media_url text,
  content_media_mime text,
  content_media_filename text,
  content_caption text, -- подпись к медиа
  
  -- Sender info (для групп)
  sender_jid text,
  sender_name text,
  
  -- Status (для исходящих)
  status text DEFAULT 'pending', -- pending, sent, delivered, read, failed
  
  -- AI suggestion (подсказка AI для менеджера)
  ai_suggestion text,
  ai_suggestion_sources jsonb, -- источники из базы знаний
  ai_generated_at timestamptz,
  
  -- Reply to
  reply_to_message_id uuid REFERENCES whatsapp_messages(id),
  quoted_text text,
  
  -- Sent by (для исходящих)
  sent_by uuid REFERENCES auth.users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. WHATSAPP TAGS TABLE
-- Предустановленные теги для компании
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  color text DEFAULT '#6366f1', -- цвет тега
  description text,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, name)
);

-- ============================================
-- 5. WHATSAPP QUICK REPLIES
-- Быстрые ответы / шаблоны
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title text NOT NULL, -- название шаблона
  content text NOT NULL, -- текст ответа
  shortcut text, -- быстрый вызов, например /hello
  
  category text, -- категория шаблона
  usage_count integer DEFAULT 0,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 6. WHATSAPP CHAT NOTES
-- Заметки менеджеров к чатам
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_chat_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  content text NOT NULL,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_tenant ON whatsapp_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_tenant ON whatsapp_chats(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_session ON whatsapp_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_assigned ON whatsapp_chats(assigned_to);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_status ON whatsapp_chats(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message ON whatsapp_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_tags ON whatsapp_chats USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_id ON whatsapp_messages(wa_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_tags_tenant ON whatsapp_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_tenant ON whatsapp_quick_replies(tenant_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chat_notes ENABLE ROW LEVEL SECURITY;

-- Sessions: tenant-scoped
CREATE POLICY "Tenant users can access own whatsapp_sessions"
  ON whatsapp_sessions FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Chats: tenant-scoped with role-based visibility
CREATE POLICY "Tenant users can access own whatsapp_chats"
  ON whatsapp_chats FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Messages: through chat access
CREATE POLICY "Tenant users can access own whatsapp_messages"
  ON whatsapp_messages FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Tags: tenant-scoped
CREATE POLICY "Tenant users can access own whatsapp_tags"
  ON whatsapp_tags FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Quick replies: tenant-scoped
CREATE POLICY "Tenant users can access own whatsapp_quick_replies"
  ON whatsapp_quick_replies FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Chat notes: tenant-scoped
CREATE POLICY "Tenant users can access own whatsapp_chat_notes"
  ON whatsapp_chat_notes FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- ============================================
-- DEFAULT TENANT_ID FUNCTION
-- ============================================

ALTER TABLE whatsapp_sessions ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE whatsapp_chats ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE whatsapp_messages ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE whatsapp_tags ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE whatsapp_quick_replies ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
ALTER TABLE whatsapp_chat_notes ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get unread chats count for current user
CREATE OR REPLACE FUNCTION get_whatsapp_unread_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_unread integer;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO total_unread
  FROM whatsapp_chats
  WHERE tenant_id = public.current_tenant_id()
    AND status = 'open'
    AND (assigned_to = auth.uid() OR assigned_to IS NULL);
  
  RETURN total_unread;
END;
$$;

-- Function to assign chat to user
CREATE OR REPLACE FUNCTION assign_whatsapp_chat(
  p_chat_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE whatsapp_chats
  SET 
    assigned_to = p_user_id,
    assigned_at = now(),
    updated_at = now()
  WHERE id = p_chat_id
    AND tenant_id = public.current_tenant_id();
END;
$$;

-- Function to get chat statistics
CREATE OR REPLACE FUNCTION get_whatsapp_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_chats', (SELECT COUNT(*) FROM whatsapp_chats WHERE tenant_id = public.current_tenant_id()),
    'open_chats', (SELECT COUNT(*) FROM whatsapp_chats WHERE tenant_id = public.current_tenant_id() AND status = 'open'),
    'unassigned_chats', (SELECT COUNT(*) FROM whatsapp_chats WHERE tenant_id = public.current_tenant_id() AND assigned_to IS NULL AND status = 'open'),
    'total_messages_today', (SELECT COUNT(*) FROM whatsapp_messages WHERE tenant_id = public.current_tenant_id() AND created_at >= CURRENT_DATE),
    'connected_sessions', (SELECT COUNT(*) FROM whatsapp_sessions WHERE tenant_id = public.current_tenant_id() AND status = 'connected')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER whatsapp_chats_updated_at
  BEFORE UPDATE ON whatsapp_chats
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER whatsapp_quick_replies_updated_at
  BEFORE UPDATE ON whatsapp_quick_replies
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- ============================================
-- INSERT DEFAULT TAGS
-- ============================================

-- Эти теги будут добавлены для каждого tenant'а при первом использовании
-- через код приложения

COMMENT ON TABLE whatsapp_sessions IS 'WhatsApp sessions for each tenant, stores Baileys auth data';
COMMENT ON TABLE whatsapp_chats IS 'WhatsApp conversations, can be assigned to team members';
COMMENT ON TABLE whatsapp_messages IS 'All WhatsApp messages with AI suggestions';
COMMENT ON TABLE whatsapp_tags IS 'Custom tags for organizing chats';
COMMENT ON TABLE whatsapp_quick_replies IS 'Quick reply templates for faster responses';
COMMENT ON TABLE whatsapp_chat_notes IS 'Internal notes on chats, visible only to team';
