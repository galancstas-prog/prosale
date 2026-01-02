'use server'

import { getSupabaseClient } from '@/lib/supabase-client'
const supabase = getSupabaseClient()

export async function getMyProgress(docId: string) {
  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('doc_id', docId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching progress:', error)
    return { data: null }
  }

  return { data }
}

export async function markDocInProgress(docId: string) {
  const { data: existing } = await supabase
    .from('training_progress')
    .select('*')
    .eq('doc_id', docId)
    .maybeSingle()

  if (existing) {
    return { data: existing }
  }

  const { data, error } = await supabase
    .from('training_progress')
    .insert({
      doc_id: docId,
      completed: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error marking doc in progress:', error)
    return { error: 'Failed to update progress' }
  }

  return { data }
}

export async function markDocCompleted(docId: string) {
  const { data: existing } = await supabase
    .from('training_progress')
    .select('*')
    .eq('doc_id', docId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('training_progress')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating progress:', error)
      return { error: 'Failed to update progress' }
    }
  } else {
    const { error } = await supabase
      .from('training_progress')
      .insert({
        doc_id: docId,
        completed: true,
        completed_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating progress:', error)
      return { error: 'Failed to update progress' }
    }
  }

  return { success: true }
}

export async function getAllProgress() {
  const { data, error } = await supabase
    .from('training_progress')
    .select('*, training_docs(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all progress:', error)
    return { data: [] }
  }

  return { data: data || [] }
}
