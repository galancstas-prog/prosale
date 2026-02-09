// WhatsApp Integration Types
// ProSale Multi-Tenant WhatsApp Module

export type WhatsAppSessionStatus = 'disconnected' | 'qr_pending' | 'connecting' | 'connected'

export type WhatsAppChatStatus = 'open' | 'pending' | 'resolved' | 'archived'

export type WhatsAppChatPriority = 'low' | 'normal' | 'high' | 'urgent'

export type WhatsAppMessageDirection = 'in' | 'out'

export type WhatsAppMessageContentType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'sticker' 
  | 'location'
  | 'contact'

export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

// ============================================
// DATABASE MODELS
// ============================================

export interface WhatsAppSession {
  id: string
  tenant_id: string
  session_name: string
  phone_number: string | null
  status: WhatsAppSessionStatus
  session_data: any
  last_connected_at: string | null
  qr_code: string | null
  qr_expires_at: string | null
  auto_assign: boolean
  welcome_message: string | null
  ai_suggestions_enabled: boolean
  created_at: string
  updated_at: string
}

export interface WhatsAppChat {
  id: string
  session_id: string
  tenant_id: string
  remote_jid: string
  contact_phone: string
  contact_name: string | null
  contact_avatar_url: string | null
  assigned_to: string | null
  assigned_at: string | null
  status: WhatsAppChatStatus
  priority: WhatsAppChatPriority
  tags: string[]
  last_message_text: string | null
  last_message_at: string | null
  last_message_direction: WhatsAppMessageDirection | null
  unread_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WhatsAppMessage {
  id: string
  chat_id: string
  tenant_id: string
  wa_message_id: string | null
  direction: WhatsAppMessageDirection
  content_type: WhatsAppMessageContentType
  content_text: string | null
  content_media_url: string | null
  content_media_mime: string | null
  content_media_filename: string | null
  content_caption: string | null
  sender_jid: string | null
  sender_name: string | null
  status: WhatsAppMessageStatus
  ai_suggestion: string | null
  ai_suggestion_sources: AISuggestionSource[] | null
  ai_generated_at: string | null
  reply_to_message_id: string | null
  quoted_text: string | null
  sent_by: string | null
  created_at: string
  updated_at: string
}

export interface WhatsAppTag {
  id: string
  tenant_id: string
  name: string
  color: string
  description: string | null
  created_at: string
}

export interface WhatsAppQuickReply {
  id: string
  tenant_id: string
  title: string
  content: string
  shortcut: string | null
  category: string | null
  usage_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface WhatsAppChatNote {
  id: string
  chat_id: string
  tenant_id: string
  content: string
  created_by: string | null
  created_at: string
}

// ============================================
// EXTENDED TYPES FOR UI
// ============================================

export interface WhatsAppChatWithDetails extends WhatsAppChat {
  session?: WhatsAppSession
  assigned_user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  messages_count?: number
}

export interface WhatsAppMessageWithSender extends WhatsAppMessage {
  sent_by_user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface AISuggestionSource {
  module: 'scripts' | 'training' | 'faq' | 'kb'
  id: string
  title: string
  snippet: string
  similarity: number
}

export interface WhatsAppStats {
  total_chats: number
  open_chats: number
  unassigned_chats: number
  total_messages_today: number
  connected_sessions: number
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface SendMessageRequest {
  chat_id: string
  content_type: WhatsAppMessageContentType
  content_text?: string
  content_media_url?: string
  reply_to_message_id?: string
}

export interface CreateSessionRequest {
  session_name: string
  auto_assign?: boolean
  ai_suggestions_enabled?: boolean
}

export interface AssignChatRequest {
  chat_id: string
  user_id: string | null
}

export interface UpdateChatRequest {
  chat_id: string
  status?: WhatsAppChatStatus
  priority?: WhatsAppChatPriority
  tags?: string[]
}

export interface GenerateAISuggestionRequest {
  message_id: string
  message_text: string
  chat_context?: string[]
}

export interface GenerateAISuggestionResponse {
  suggestion: string
  sources: AISuggestionSource[]
}

// ============================================
// WEBSOCKET EVENT TYPES
// ============================================

export type WhatsAppEventType = 
  | 'connection.update'
  | 'qr.update'
  | 'message.new'
  | 'message.update'
  | 'chat.update'
  | 'typing.update'

export interface WhatsAppEvent {
  type: WhatsAppEventType
  session_id: string
  data: any
  timestamp: string
}

export interface ConnectionUpdateEvent {
  type: 'connection.update'
  session_id: string
  data: {
    status: WhatsAppSessionStatus
    phone_number?: string
  }
}

export interface QRUpdateEvent {
  type: 'qr.update'
  session_id: string
  data: {
    qr_code: string
    expires_at: string
  }
}

export interface NewMessageEvent {
  type: 'message.new'
  session_id: string
  data: {
    message: WhatsAppMessage
    chat: WhatsAppChat
  }
}

// ============================================
// FILTER & SORT TYPES
// ============================================

export interface ChatFilters {
  status?: WhatsAppChatStatus | 'all'
  assigned_to?: string | 'unassigned' | 'all'
  tags?: string[]
  priority?: WhatsAppChatPriority | 'all'
  search?: string
  session_id?: string
}

export type ChatSortField = 'last_message_at' | 'created_at' | 'unread_count' | 'priority'
export type ChatSortOrder = 'asc' | 'desc'

export interface ChatSort {
  field: ChatSortField
  order: ChatSortOrder
}

// ============================================
// TEAM MEMBER TYPE FOR ASSIGNMENT
// ============================================

export interface TeamMemberForAssignment {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: 'ADMIN' | 'OWNER' | 'MANAGER'
  active_chats_count: number
}
