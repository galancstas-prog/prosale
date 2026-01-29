'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

interface ExportData {
  version: string
  exportedAt: string
  module: string
  data: any
}

// Экспорт скриптов
export async function exportScripts() {
  const supabase = await getSupabaseServerClient()

  // Получаем категории
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'script')
    .order('order_index')

  if (catError) return { error: catError.message }

  // Получаем threads для каждой категории
  const { data: threads, error: threadError } = await supabase
    .from('script_threads')
    .select('*')
    .order('order_index')

  if (threadError) return { error: threadError.message }

  // Получаем turns для каждого thread
  const { data: turns, error: turnError } = await supabase
    .from('script_turns')
    .select('*')
    .order('order_index')

  if (turnError) return { error: turnError.message }

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    module: 'scripts',
    data: {
      categories: categories || [],
      threads: threads || [],
      turns: turns || [],
    },
  }

  return { data: exportData }
}

// Экспорт базы знаний
export async function exportKnowledge() {
  const supabase = await getSupabaseServerClient()

  const { data: categories, error: catError } = await supabase
    .from('kb_categories')
    .select('*')
    .order('order_index')

  if (catError) return { error: catError.message }

  const { data: pages, error: pageError } = await supabase
    .from('kb_pages')
    .select('*')
    .order('order_index')

  if (pageError) return { error: pageError.message }

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    module: 'knowledge',
    data: {
      categories: categories || [],
      pages: pages || [],
    },
  }

  return { data: exportData }
}

// Экспорт обучения
export async function exportTraining() {
  const supabase = await getSupabaseServerClient()

  const { data: categories, error: catError } = await supabase
    .from('training_categories')
    .select('*')
    .order('order_index')

  if (catError) return { error: catError.message }

  const { data: subcategories, error: subError } = await supabase
    .from('training_subcategories')
    .select('*')
    .order('order_index')

  if (subError) return { error: subError.message }

  const { data: docs, error: docError } = await supabase
    .from('training_docs')
    .select('*')
    .order('order_index')

  if (docError) return { error: docError.message }

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    module: 'training',
    data: {
      categories: categories || [],
      subcategories: subcategories || [],
      docs: docs || [],
    },
  }

  return { data: exportData }
}

// =====================================================
// IMPORT FUNCTIONS
// =====================================================

// Импорт скриптов
export async function importScripts(jsonData: string) {
  const supabase = await getSupabaseServerClient()

  let importData: ExportData
  try {
    importData = JSON.parse(jsonData)
  } catch {
    return { error: 'Неверный формат JSON' }
  }

  if (importData.module !== 'scripts') {
    return { error: 'Этот файл не содержит данные скриптов' }
  }

  const { categories, threads, turns } = importData.data

  // Маппинг старых ID на новые
  const categoryIdMap: Record<string, string> = {}
  const threadIdMap: Record<string, string> = {}

  // Импортируем категории
  for (const cat of categories) {
    const { id: oldId, tenant_id, created_at, ...catData } = cat
    const { data: newCat, error } = await supabase
      .from('categories')
      .insert({ ...catData, type: 'script' })
      .select('id')
      .single()

    if (error) {
      console.error('[importScripts] Category error:', error)
      continue
    }
    categoryIdMap[oldId] = newCat.id
  }

  // Импортируем threads
  for (const thread of threads) {
    const { id: oldId, category_id, tenant_id, created_at, ...threadData } = thread
    const newCategoryId = categoryIdMap[category_id]
    if (!newCategoryId) continue

    const { data: newThread, error } = await supabase
      .from('script_threads')
      .insert({ ...threadData, category_id: newCategoryId })
      .select('id')
      .single()

    if (error) {
      console.error('[importScripts] Thread error:', error)
      continue
    }
    threadIdMap[oldId] = newThread.id
  }

  // Импортируем turns
  for (const turn of turns) {
    const { id: oldId, thread_id, tenant_id, created_at, ...turnData } = turn
    const newThreadId = threadIdMap[thread_id]
    if (!newThreadId) continue

    const { error } = await supabase
      .from('script_turns')
      .insert({ ...turnData, thread_id: newThreadId })

    if (error) {
      console.error('[importScripts] Turn error:', error)
    }
  }

  safeRevalidatePath('/app/scripts')
  return { 
    success: true, 
    imported: {
      categories: Object.keys(categoryIdMap).length,
      threads: Object.keys(threadIdMap).length,
    }
  }
}

// Импорт базы знаний
export async function importKnowledge(jsonData: string) {
  const supabase = await getSupabaseServerClient()

  let importData: ExportData
  try {
    importData = JSON.parse(jsonData)
  } catch {
    return { error: 'Неверный формат JSON' }
  }

  if (importData.module !== 'knowledge') {
    return { error: 'Этот файл не содержит данные базы знаний' }
  }

  const { categories, pages } = importData.data
  const categoryIdMap: Record<string, string> = {}

  for (const cat of categories) {
    const { id: oldId, tenant_id, created_at, ...catData } = cat
    const { data: newCat, error } = await supabase
      .from('kb_categories')
      .insert(catData)
      .select('id')
      .single()

    if (error) {
      console.error('[importKnowledge] Category error:', error)
      continue
    }
    categoryIdMap[oldId] = newCat.id
  }

  let pagesImported = 0
  for (const page of pages) {
    const { id: oldId, category_id, tenant_id, created_at, ...pageData } = page
    const newCategoryId = categoryIdMap[category_id]
    if (!newCategoryId) continue

    const { error } = await supabase
      .from('kb_pages')
      .insert({ ...pageData, category_id: newCategoryId })

    if (!error) pagesImported++
  }

  safeRevalidatePath('/app/knowledge')
  return { 
    success: true, 
    imported: {
      categories: Object.keys(categoryIdMap).length,
      pages: pagesImported,
    }
  }
}

// Импорт обучения
export async function importTraining(jsonData: string) {
  const supabase = await getSupabaseServerClient()

  let importData: ExportData
  try {
    importData = JSON.parse(jsonData)
  } catch {
    return { error: 'Неверный формат JSON' }
  }

  if (importData.module !== 'training') {
    return { error: 'Этот файл не содержит данные обучения' }
  }

  const { categories, subcategories, docs } = importData.data
  const categoryIdMap: Record<string, string> = {}
  const subcategoryIdMap: Record<string, string> = {}

  for (const cat of categories) {
    const { id: oldId, tenant_id, created_at, ...catData } = cat
    const { data: newCat, error } = await supabase
      .from('training_categories')
      .insert(catData)
      .select('id')
      .single()

    if (error) {
      console.error('[importTraining] Category error:', error)
      continue
    }
    categoryIdMap[oldId] = newCat.id
  }

  for (const sub of subcategories || []) {
    const { id: oldId, category_id, tenant_id, created_at, ...subData } = sub
    const newCategoryId = categoryIdMap[category_id]
    if (!newCategoryId) continue

    const { data: newSub, error } = await supabase
      .from('training_subcategories')
      .insert({ ...subData, category_id: newCategoryId })
      .select('id')
      .single()

    if (error) {
      console.error('[importTraining] Subcategory error:', error)
      continue
    }
    subcategoryIdMap[oldId] = newSub.id
  }

  let docsImported = 0
  for (const doc of docs) {
    const { id: oldId, category_id, subcategory_id, tenant_id, created_at, ...docData } = doc
    const newCategoryId = categoryIdMap[category_id]
    if (!newCategoryId) continue

    const newSubcategoryId = subcategory_id ? subcategoryIdMap[subcategory_id] : null

    const { error } = await supabase
      .from('training_docs')
      .insert({ ...docData, category_id: newCategoryId, subcategory_id: newSubcategoryId })

    if (!error) docsImported++
  }

  safeRevalidatePath('/app/training')
  return { 
    success: true, 
    imported: {
      categories: Object.keys(categoryIdMap).length,
      subcategories: Object.keys(subcategoryIdMap).length,
      docs: docsImported,
    }
  }
}
