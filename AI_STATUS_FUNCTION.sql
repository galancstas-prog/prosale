-- AI Status Function
-- Функция для проверки статуса AI индексации
-- ВАЖНО: Выполните этот SQL в Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_ai_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '30s'
AS $$
DECLARE
  chunk_count integer;
  result_status text;
BEGIN
  -- Подсчитываем количество чанков в таблице ai_chunks
  SELECT COUNT(*) INTO chunk_count
  FROM ai_chunks;
  
  -- Определяем статус на основе количества чанков
  IF chunk_count = 0 THEN
    result_status := 'empty';
  ELSIF chunk_count > 0 THEN
    -- Проверяем, есть ли чанки без embeddings (индексируются)
    IF EXISTS (
      SELECT 1 FROM ai_chunks 
      WHERE embedding IS NULL 
      LIMIT 1
    ) THEN
      result_status := 'indexing';
    ELSE
      result_status := 'ready';
    END IF;
  ELSE
    result_status := 'needs_reindex';
  END IF;
  
  -- Возвращаем результат в формате JSON
  RETURN jsonb_build_object(
    'status', result_status,
    'chunk_count', chunk_count,
    'timestamp', extract(epoch from now())
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки возвращаем empty статус
    RETURN jsonb_build_object(
      'status', 'empty',
      'chunk_count', 0,
      'error', SQLERRM
    );
END;
$$;

-- Даём права на выполнение функции для аутентифицированных пользователей
GRANT EXECUTE ON FUNCTION get_ai_status() TO authenticated;

-- Комментарий к функции
COMMENT ON FUNCTION get_ai_status() IS 'Возвращает статус AI индексации: empty, indexing, ready или needs_reindex';
