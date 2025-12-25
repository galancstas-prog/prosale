'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { revalidatePath } from 'next/cache'

export async function getMyProgress(docId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', user.appUser.id)
    .eq('doc_id', docId)
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function markDocInProgress(docId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('training_progress')
    .select('id')
    .eq('user_id', user.appUser.id)
    .eq('doc_id', docId)
    .maybeSingle()

  if (existing) {
    return { data: existing }
  }

  const { data, error } = await supabase
    .from('training_progress')
    .insert({
      tenant_id: user.appUser.tenant_id,
      user_id: user.appUser.id,
      doc_id: docId,
      progress_percent: 0,
      last_accessed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/training/doc/${docId}`)
  return { data }
}

export async function markDocCompleted(docId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('training_progress')
    .select('id')
    .eq('user_id', user.appUser.id)
    .eq('doc_id', docId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('training_progress')
      .update({
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('training_progress')
      .insert({
        tenant_id: user.appUser.tenant_id,
        user_id: user.appUser.id,
        doc_id: docId,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/app/training/doc/${docId}`)
  revalidatePath('/app/admin/progress')
  return { success: true }
}

export async function getAllProgress() {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { data: managers, error: managersError } = await supabase
    .from('app_users')
    .select('id, email, full_name')
    .eq('tenant_id', user.appUser.tenant_id)
    .order('email')

  if (managersError) {
    return { error: managersError.message }
  }

  const { data: docs, error: docsError } = await supabase
    .from('training_docs')
    .select('id, title, category_id')
    .eq('tenant_id', user.appUser.tenant_id)
    .order('title')

  if (docsError) {
    return { error: docsError.message }
  }

  const { data: progress, error: progressError } = await supabase
    .from('training_progress')
    .select('*')
    .eq('tenant_id', user.appUser.tenant_id)

  if (progressError) {
    return { error: progressError.message }
  }

  const progressMap = new Map()
  progress?.forEach((p) => {
    progressMap.set(`${p.user_id}-${p.doc_id}`, p)
  })

  const rows: Array<{
    manager_email: string
    manager_name: string | null
    doc_title: string
    status: 'not_started' | 'in_progress' | 'completed'
    updated_at: string | null
  }> = []

  for (const manager of managers || []) {
    for (const doc of docs || []) {
      const key = `${manager.id}-${doc.id}`
      const prog = progressMap.get(key)

      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started'
      let updated: string | null = null

      if (prog) {
        if (prog.progress_percent === 100 && prog.completed_at) {
          status = 'completed'
        } else if (prog.progress_percent > 0) {
          status = 'in_progress'
        }
        updated = prog.last_accessed_at || prog.updated_at
      }

      rows.push({
        manager_email: manager.email,
        manager_name: manager.full_name,
        doc_title: doc.title,
        status,
        updated_at: updated,
      })
    }
  }

  return { data: rows }
}
