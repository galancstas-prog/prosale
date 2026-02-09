// WhatsApp Server Actions
// ProSale Multi-Tenant WhatsApp Module
'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'
import type {
  WhatsAppSession,
  WhatsAppChat,
  WhatsAppMessage,
  WhatsAppTag,
  WhatsAppQuickReply,
  WhatsAppChatNote,
  WhatsAppStats,
  WhatsAppChatStatus,
  WhatsAppChatPriority,
  ChatFilters,
  TeamMemberForAssignment,
} from './types'

// ============================================
// SESSION ACTIONS
// ============================================

export async function getSessions(): Promise<{ data: WhatsAppSession[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getSession(sessionId: string): Promise<{ data: WhatsAppSession | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createSession(
  sessionName: string,
  options?: { auto_assign?: boolean; ai_suggestions_enabled?: boolean }
): Promise<{ data: WhatsAppSession | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .insert({
      session_name: sessionName,
      auto_assign: options?.auto_assign ?? true,
      ai_suggestions_enabled: options?.ai_suggestions_enabled ?? true,
      status: 'disconnected',
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  safeRevalidatePath('/app/admin/whatsapp')
  return { data, error: null }
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<WhatsAppSession, 'session_name' | 'auto_assign' | 'ai_suggestions_enabled' | 'welcome_message'>>
): Promise<{ data: WhatsAppSession | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  safeRevalidatePath('/app/admin/whatsapp')
  return { data, error: null }
}

export async function deleteSession(sessionId: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('whatsapp_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) return { error: error.message }

  safeRevalidatePath('/app/whatsapp')
  safeRevalidatePath('/app/admin/whatsapp')
  return { error: null }
}

// ============================================
// CHAT ACTIONS
// ============================================

export async function getChats(
  filters?: ChatFilters
): Promise<{ data: WhatsAppChat[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('whatsapp_chats')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.assigned_to) {
    if (filters.assigned_to === 'unassigned') {
      query = query.is('assigned_to', null)
    } else if (filters.assigned_to !== 'all') {
      query = query.eq('assigned_to', filters.assigned_to)
    }
  }

  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  if (filters?.session_id) {
    query = query.eq('session_id', filters.session_id)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  if (filters?.search) {
    query = query.or(`contact_name.ilike.%${filters.search}%,contact_phone.ilike.%${filters.search}%,last_message_text.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getChat(chatId: string): Promise<{ data: WhatsAppChat | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateChat(
  chatId: string,
  updates: Partial<Pick<WhatsAppChat, 'status' | 'priority' | 'tags'>>
): Promise<{ data: WhatsAppChat | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_chats')
    .update(updates)
    .eq('id', chatId)
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  return { data, error: null }
}

export async function assignChat(
  chatId: string,
  userId: string | null
): Promise<{ data: WhatsAppChat | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_chats')
    .update({
      assigned_to: userId,
      assigned_at: userId ? new Date().toISOString() : null,
    })
    .eq('id', chatId)
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  return { data, error: null }
}

export async function markChatAsRead(chatId: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('whatsapp_chats')
    .update({ unread_count: 0 })
    .eq('id', chatId)

  if (error) return { error: error.message }
  return { error: null }
}

// ============================================
// MESSAGE ACTIONS
// ============================================

export async function getMessages(
  chatId: string,
  options?: { limit?: number; before?: string }
): Promise<{ data: WhatsAppMessage[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 50)

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  
  // Reverse to get chronological order
  return { data: data?.reverse() || [], error: null }
}

export async function createMessage(
  chatId: string,
  message: {
    direction: 'in' | 'out'
    content_type: string
    content_text?: string
    content_media_url?: string
    content_caption?: string
    wa_message_id?: string
    sender_jid?: string
    sender_name?: string
    reply_to_message_id?: string
    quoted_text?: string
  }
): Promise<{ data: WhatsAppMessage | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  // Get tenant_id from chat
  const { data: chat, error: chatError } = await supabase
    .from('whatsapp_chats')
    .select('tenant_id')
    .eq('id', chatId)
    .single()

  if (chatError) return { data: null, error: chatError.message }

  // Get current user for outgoing messages
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert({
      chat_id: chatId,
      tenant_id: chat.tenant_id,
      direction: message.direction,
      content_type: message.content_type,
      content_text: message.content_text,
      content_media_url: message.content_media_url,
      content_caption: message.content_caption,
      wa_message_id: message.wa_message_id,
      sender_jid: message.sender_jid,
      sender_name: message.sender_name,
      reply_to_message_id: message.reply_to_message_id,
      quoted_text: message.quoted_text,
      sent_by: message.direction === 'out' ? user?.id : null,
      status: message.direction === 'out' ? 'pending' : 'delivered',
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  // Update chat's last message
  await supabase
    .from('whatsapp_chats')
    .update({
      last_message_text: message.content_text || `[${message.content_type}]`,
      last_message_at: new Date().toISOString(),
      last_message_direction: message.direction,
      unread_count: message.direction === 'in' 
        ? supabase.rpc('increment_unread', { chat_id: chatId })
        : 0,
    })
    .eq('id', chatId)

  return { data, error: null }
}

export async function updateMessageAISuggestion(
  messageId: string,
  suggestion: string,
  sources: any[]
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('whatsapp_messages')
    .update({
      ai_suggestion: suggestion,
      ai_suggestion_sources: sources,
      ai_generated_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (error) return { error: error.message }
  return { error: null }
}

// ============================================
// TAGS ACTIONS
// ============================================

export async function getTags(): Promise<{ data: WhatsAppTag[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createTag(
  name: string,
  color: string,
  description?: string
): Promise<{ data: WhatsAppTag | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_tags')
    .insert({ name, color, description })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  safeRevalidatePath('/app/admin/whatsapp')
  return { data, error: null }
}

export async function updateTag(
  tagId: string,
  updates: Partial<Pick<WhatsAppTag, 'name' | 'color' | 'description'>>
): Promise<{ data: WhatsAppTag | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_tags')
    .update(updates)
    .eq('id', tagId)
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  safeRevalidatePath('/app/admin/whatsapp')
  return { data, error: null }
}

export async function deleteTag(tagId: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('whatsapp_tags')
    .delete()
    .eq('id', tagId)

  if (error) return { error: error.message }

  safeRevalidatePath('/app/whatsapp')
  safeRevalidatePath('/app/admin/whatsapp')
  return { error: null }
}

// ============================================
// QUICK REPLIES ACTIONS
// ============================================

export async function getQuickReplies(): Promise<{ data: WhatsAppQuickReply[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_quick_replies')
    .select('*')
    .order('usage_count', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createQuickReply(
  title: string,
  content: string,
  shortcut?: string,
  category?: string
): Promise<{ data: WhatsAppQuickReply | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('whatsapp_quick_replies')
    .insert({
      title,
      content,
      shortcut,
      category,
      created_by: user?.id,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  safeRevalidatePath('/app/whatsapp')
  return { data, error: null }
}

export async function incrementQuickReplyUsage(replyId: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.rpc('increment_quick_reply_usage', { reply_id: replyId })

  if (error) return { error: error.message }
  return { error: null }
}

// ============================================
// CHAT NOTES ACTIONS
// ============================================

export async function getChatNotes(chatId: string): Promise<{ data: WhatsAppChatNote[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('whatsapp_chat_notes')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createChatNote(
  chatId: string,
  content: string
): Promise<{ data: WhatsAppChatNote | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get tenant_id from chat
  const { data: chat, error: chatError } = await supabase
    .from('whatsapp_chats')
    .select('tenant_id')
    .eq('id', chatId)
    .single()

  if (chatError) return { data: null, error: chatError.message }

  const { data, error } = await supabase
    .from('whatsapp_chat_notes')
    .insert({
      chat_id: chatId,
      tenant_id: chat.tenant_id,
      content,
      created_by: user?.id,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ============================================
// STATS & TEAM ACTIONS
// ============================================

export async function getWhatsAppStats(): Promise<{ data: WhatsAppStats | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase.rpc('get_whatsapp_stats')

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getTeamMembersForAssignment(): Promise<{ data: TeamMemberForAssignment[] | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  // Get current tenant's members
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Get tenant_id
  const { data: membership, error: memberError } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (memberError) return { data: null, error: memberError.message }

  // Get all team members
  const { data: members, error: membersError } = await supabase
    .from('tenant_members')
    .select(`
      user_id,
      role,
      users:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('tenant_id', membership.tenant_id)

  if (membersError) return { data: null, error: membersError.message }

  // Get active chats count for each member
  const { data: chatCounts, error: countsError } = await supabase
    .from('whatsapp_chats')
    .select('assigned_to')
    .eq('status', 'open')

  const countsMap = new Map<string, number>()
  if (!countsError && chatCounts) {
    chatCounts.forEach((chat: any) => {
      if (chat.assigned_to) {
        countsMap.set(chat.assigned_to, (countsMap.get(chat.assigned_to) || 0) + 1)
      }
    })
  }

  const result: TeamMemberForAssignment[] = members.map((m: any) => ({
    id: m.user_id,
    email: m.users?.email || '',
    first_name: m.users?.raw_user_meta_data?.first_name,
    last_name: m.users?.raw_user_meta_data?.last_name,
    role: m.role,
    active_chats_count: countsMap.get(m.user_id) || 0,
  }))

  return { data: result, error: null }
}

export async function getUnreadCount(): Promise<{ data: number; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase.rpc('get_whatsapp_unread_count')

  if (error) return { data: 0, error: error.message }
  return { data: data || 0, error: null }
}

// ============================================
// INIT DEFAULT TAGS
// ============================================

export async function initDefaultTags(): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const defaultTags = [
    { name: 'Новый клиент', color: '#22c55e' },
    { name: 'VIP', color: '#eab308' },
    { name: 'Возврат', color: '#ef4444' },
    { name: 'Вопрос', color: '#3b82f6' },
    { name: 'Заказ', color: '#8b5cf6' },
    { name: 'Рекламация', color: '#f97316' },
  ]

  for (const tag of defaultTags) {
    await supabase
      .from('whatsapp_tags')
      .upsert({ name: tag.name, color: tag.color }, { onConflict: 'tenant_id,name' })
  }

  return { error: null }
}
