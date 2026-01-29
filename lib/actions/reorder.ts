'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

// =====================================================
// REORDER FUNCTIONS
// =====================================================

export async function reorderCategories(categoryIds: string[]) {
  const supabase = await getSupabaseServerClient()

  // Обновляем order_index для каждой категории
  for (let i = 0; i < categoryIds.length; i++) {
    const { error } = await supabase
      .from('categories')
      .update({ order_index: i })
      .eq('id', categoryIds[i])

    if (error) {
      console.error('[reorderCategories]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/scripts')
  return { success: true }
}

export async function reorderScriptThreads(categoryId: string, threadIds: string[]) {
  const supabase = await getSupabaseServerClient()

  for (let i = 0; i < threadIds.length; i++) {
    const { error } = await supabase
      .from('script_threads')
      .update({ order_index: i })
      .eq('id', threadIds[i])

    if (error) {
      console.error('[reorderScriptThreads]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/scripts')
  safeRevalidatePath(`/app/scripts/${categoryId}`)
  return { success: true }
}

export async function reorderKbCategories(categoryIds: string[]) {
  const supabase = await getSupabaseServerClient()

  for (let i = 0; i < categoryIds.length; i++) {
    const { error } = await supabase
      .from('categories')
      .update({ order_index: i })
      .eq('id', categoryIds[i])

    if (error) {
      console.error('[reorderKbCategories]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/knowledge')
  return { success: true }
}

export async function reorderKbPages(categoryId: string, pageIds: string[]) {
  const supabase = await getSupabaseServerClient()

  for (let i = 0; i < pageIds.length; i++) {
    const { error } = await supabase
      .from('kb_pages')
      .update({ order_index: i })
      .eq('id', pageIds[i])

    if (error) {
      console.error('[reorderKbPages]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/knowledge')
  return { success: true }
}

export async function reorderTrainingCategories(categoryIds: string[]) {
  const supabase = await getSupabaseServerClient()

  for (let i = 0; i < categoryIds.length; i++) {
    const { error } = await supabase
      .from('training_categories')
      .update({ order_index: i })
      .eq('id', categoryIds[i])

    if (error) {
      console.error('[reorderTrainingCategories]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/training')
  return { success: true }
}

export async function reorderTrainingSubcategories(categoryId: string, subcategoryIds: string[]) {
  const supabase = await getSupabaseServerClient()

  for (let i = 0; i < subcategoryIds.length; i++) {
    const { error } = await supabase
      .from('training_subcategories')
      .update({ order_index: i })
      .eq('id', subcategoryIds[i])

    if (error) {
      console.error('[reorderTrainingSubcategories]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/training')
  return { success: true }
}

export async function reorderTrainingDocs(categoryId: string, docIds: string[]) {
  const supabase = await getSupabaseServerClient()

  for (let i = 0; i < docIds.length; i++) {
    const { error } = await supabase
      .from('training_docs')
      .update({ order_index: i })
      .eq('id', docIds[i])

    if (error) {
      console.error('[reorderTrainingDocs]', error)
      return { error: error.message }
    }
  }

  safeRevalidatePath('/app/training')
  return { success: true }
}
