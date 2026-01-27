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
  tenant_uuid uuid;
  tenant_ai_status text;
  tenant_last_indexed timestamptz;
BEGIN
  -- Получаем tenant_id текущего пользователя
  tenant_uuid := public.current_tenant_id();
  
  -- Читаем ai_status из таблицы tenants
  SELECT ai_status, ai_last_indexed_at
  INTO tenant_ai_status, tenant_last_indexed
  FROM tenants
  WHERE id = tenant_uuid;
  
  -- Подсчитываем количество чанков для текущего тенанта
  SELECT COUNT(*) INTO chunk_count
  FROM ai_chunks
  WHERE tenant_id = tenant_uuid;
  
  -- Если статус в tenants установлен - используем его
  IF tenant_ai_status IS NOT NULL AND tenant_ai_status != '' THEN
    result_status := tenant_ai_status;
  ELSE
    -- Иначе определяем статус на основе количества чанков (fallback)
    IF chunk_count = 0 THEN
      result_status := 'empty';
    ELSE
      -- Проверяем, есть ли чанки без embeddings (индексируются)
      IF EXISTS (
        SELECT 1 FROM ai_chunks 
        WHERE tenant_id = tenant_uuid
        AND embedding IS NULL 
        LIMIT 1
      ) THEN
        result_status := 'indexing';
      ELSE
        result_status := 'ready';
      END IF;
    END IF;
  END IF;
  
  -- Возвращаем результат в формате JSON
  RETURN jsonb_build_object(
    'status', result_status,
    'chunk_count', chunk_count,
    'last_indexed_at', tenant_last_indexed,
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
