-- =====================================================
-- МИГРАЦИЯ: Добавление order_index для сортировки
-- =====================================================
-- Эта миграция добавляет поле order_index во все таблицы,
-- которые требуют ручной сортировки (drag & drop)
-- =====================================================

-- 1. Добавляем order_index в таблицу categories (общая для скриптов, kb и training)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Инициализируем order_index для существующих записей (группируем по type и tenant_id)
UPDATE categories 
SET order_index = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id, type ORDER BY created_at) as rn 
  FROM categories
) sub 
WHERE categories.id = sub.id AND categories.order_index = 0;

-- 2. Добавляем order_index в таблицу script_threads
ALTER TABLE script_threads 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

UPDATE script_threads 
SET order_index = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as rn 
  FROM script_threads
) sub 
WHERE script_threads.id = sub.id AND script_threads.order_index = 0;

-- 3. Добавляем order_index в таблицу kb_pages
ALTER TABLE kb_pages 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

UPDATE kb_pages 
SET order_index = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as rn 
  FROM kb_pages
) sub 
WHERE kb_pages.id = sub.id AND kb_pages.order_index = 0;

-- 4. Добавляем order_index в таблицу training_subcategories
ALTER TABLE training_subcategories 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

UPDATE training_subcategories 
SET order_index = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as rn 
  FROM training_subcategories
) sub 
WHERE training_subcategories.id = sub.id AND training_subcategories.order_index = 0;

-- 5. Добавляем order_index в таблицу training_docs
ALTER TABLE training_docs 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

UPDATE training_docs 
SET order_index = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as rn 
  FROM training_docs
) sub 
WHERE training_docs.id = sub.id AND training_docs.order_index = 0;

-- =====================================================
-- Создаём индексы для быстрой сортировки
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(tenant_id, type, order_index);
CREATE INDEX IF NOT EXISTS idx_script_threads_order ON script_threads(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_kb_pages_order ON kb_pages(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_subcategories_order ON training_subcategories(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_docs_order ON training_docs(category_id, order_index);

-- =====================================================
-- Готово! Теперь все таблицы поддерживают сортировку
-- =====================================================
