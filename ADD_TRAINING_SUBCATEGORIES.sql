-- ============================================
-- ДОБАВЛЕНИЕ ПОДКАТЕГОРИЙ ДЛЯ МОДУЛЯ ОБУЧЕНИЯ
-- ============================================
-- Выполните этот SQL в Supabase SQL Editor для добавления таблицы подкатегорий
-- Путь: https://supabase.com/dashboard → Ваш проект → SQL Editor
-- ============================================

-- 1. Создаём таблицу подкатегорий обучения
CREATE TABLE IF NOT EXISTS training_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Включаем Row Level Security
ALTER TABLE training_subcategories ENABLE ROW LEVEL SECURITY;

-- 3. Создаём политику доступа
DROP POLICY IF EXISTS "Allow all access to training_subcategories" ON training_subcategories;
CREATE POLICY "Allow all access to training_subcategories"
  ON training_subcategories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Добавляем колонку subcategory_id в таблицу training_docs
-- (документ может принадлежать подкатегории, если она указана)
ALTER TABLE training_docs 
ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES training_subcategories(id) ON DELETE SET NULL;

-- 5. Создаём индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_training_subcategories_category_id 
  ON training_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_training_docs_subcategory_id 
  ON training_docs(subcategory_id);

-- ============================================
-- ГОТОВО!
-- ============================================
-- Теперь структура данных обучения:
-- categories (type='training') → training_subcategories → training_docs
-- ============================================
