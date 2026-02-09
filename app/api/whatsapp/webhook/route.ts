import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook endpoint for WhatsApp Bridge
// Bridge calls this to save messages/chats instead of writing to Supabase directly
// This way Bridge doesn't need Supabase credentials

const WEBHOOK_SECRET = process.env.WA_WEBHOOK_SECRET || 'prosale-wa-bridge-2024'

// Use service role client (bypasses RLS) for webhook operations
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const supabase = getServiceClient()

    // =============================================
    // ACTION: incoming-message
    // Bridge sends when a new WhatsApp message arrives
    // =============================================
    if (action === 'incoming-message') {
      const { sessionId, remoteJid, messageId, isFromMe, contentType, contentText, senderJid, senderName, pushName } = body

      // 1. Get session to find tenant_id
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('tenant_id')
        .eq('id', sessionId)
        .single()

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      const tenantId = session.tenant_id

      // 2. Find or create chat
      const contactPhone = remoteJid.split('@')[0]
      
      let { data: chat } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('session_id', sessionId)
        .eq('remote_jid', remoteJid)
        .single()

      if (!chat) {
        const { data: newChat, error: chatErr } = await supabase
          .from('whatsapp_chats')
          .insert({
            session_id: sessionId,
            tenant_id: tenantId,
            remote_jid: remoteJid,
            contact_phone: contactPhone,
            contact_name: pushName || senderName || null,
            status: 'open',
          })
          .select('*')
          .single()

        if (chatErr) {
          console.error('Failed to create chat:', chatErr)
          return NextResponse.json({ error: 'Failed to create chat: ' + chatErr.message }, { status: 500 })
        }
        chat = newChat
      } else if (pushName && !chat.contact_name) {
        // Update contact name if we got it from pushName
        await supabase
          .from('whatsapp_chats')
          .update({ contact_name: pushName })
          .eq('id', chat.id)
      }

      // 3. Check for duplicate message
      if (messageId) {
        const { data: existing } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('wa_message_id', messageId)
          .eq('chat_id', chat.id)
          .maybeSingle()
        
        if (existing) {
          return NextResponse.json({ status: 'duplicate', chatId: chat.id })
        }
      }

      // 4. Insert message
      const direction = isFromMe ? 'out' : 'in'
      
      const { data: savedMessage, error: msgErr } = await supabase
        .from('whatsapp_messages')
        .insert({
          chat_id: chat.id,
          tenant_id: tenantId,
          wa_message_id: messageId || null,
          direction,
          content_type: contentType || 'text',
          content_text: contentText || null,
          sender_jid: senderJid || remoteJid,
          sender_name: senderName || pushName || null,
          status: 'delivered',
        })
        .select()
        .single()

      if (msgErr) {
        console.error('Failed to save message:', msgErr)
        return NextResponse.json({ error: 'Failed to save message: ' + msgErr.message }, { status: 500 })
      }

      // 5. Update chat last_message info
      const messagePreview = contentText || `[${contentType || 'media'}]`
      
      const updateData: any = {
        last_message_text: messagePreview.slice(0, 200),
        last_message_at: new Date().toISOString(),
        last_message_direction: direction,
        updated_at: new Date().toISOString(),
      }

      if (!isFromMe) {
        // Increment unread count for incoming messages
        updateData.unread_count = (chat.unread_count || 0) + 1
      }

      await supabase
        .from('whatsapp_chats')
        .update(updateData)
        .eq('id', chat.id)

      return NextResponse.json({
        status: 'saved',
        chatId: chat.id,
        messageId: savedMessage.id,
      })
    }

    // =============================================
    // ACTION: connection-update
    // Bridge sends when session status changes
    // =============================================
    if (action === 'connection-update') {
      const { sessionId, status, phoneNumber } = body

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'connected') {
        updateData.phone_number = phoneNumber || null
        updateData.qr_code = null
        updateData.qr_expires_at = null
        updateData.last_connected_at = new Date().toISOString()
      }

      if (status === 'qr_pending' && body.qrCode) {
        updateData.qr_code = body.qrCode
        updateData.qr_expires_at = new Date(Date.now() + 60000).toISOString()
      }

      if (status === 'disconnected') {
        updateData.qr_code = null
        updateData.qr_expires_at = null
      }

      const { error } = await supabase
        .from('whatsapp_sessions')
        .update(updateData)
        .eq('id', sessionId)

      if (error) {
        console.error('Failed to update session status:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ status: 'updated' })
    }

    // =============================================
    // ACTION: batch-messages
    // For syncing multiple messages at once
    // =============================================
    if (action === 'batch-messages') {
      const { messages: msgs } = body
      let saved = 0
      let errors = 0

      for (const msg of msgs || []) {
        try {
          // Re-use incoming-message logic via internal call
          const { sessionId, remoteJid, messageId, isFromMe, contentType, contentText, senderJid, senderName, pushName } = msg
          
          const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('tenant_id')
            .eq('id', sessionId)
            .single()

          if (!session) continue

          const contactPhone = remoteJid.split('@')[0]
          
          let { data: chat } = await supabase
            .from('whatsapp_chats')
            .select('id, unread_count')
            .eq('session_id', sessionId)
            .eq('remote_jid', remoteJid)
            .single()

          if (!chat) {
            const { data: newChat } = await supabase
              .from('whatsapp_chats')
              .insert({
                session_id: sessionId,
                tenant_id: session.tenant_id,
                remote_jid: remoteJid,
                contact_phone: contactPhone,
                contact_name: pushName || senderName || null,
                status: 'open',
              })
              .select('id, unread_count')
              .single()
            chat = newChat
          }

          if (!chat) continue

          // Skip duplicates
          if (messageId) {
            const { data: existing } = await supabase
              .from('whatsapp_messages')
              .select('id')
              .eq('wa_message_id', messageId)
              .eq('chat_id', chat.id)
              .maybeSingle()
            if (existing) continue
          }

          await supabase
            .from('whatsapp_messages')
            .insert({
              chat_id: chat.id,
              tenant_id: session.tenant_id,
              wa_message_id: messageId || null,
              direction: isFromMe ? 'out' : 'in',
              content_type: contentType || 'text',
              content_text: contentText || null,
              sender_jid: senderJid || remoteJid,
              sender_name: senderName || pushName || null,
              status: 'delivered',
            })

          await supabase
            .from('whatsapp_chats')
            .update({
              last_message_text: (contentText || `[${contentType}]`).slice(0, 200),
              last_message_at: new Date().toISOString(),
              last_message_direction: isFromMe ? 'out' : 'in',
              unread_count: isFromMe ? (chat.unread_count || 0) : (chat.unread_count || 0) + 1,
            })
            .eq('id', chat.id)

          saved++
        } catch (e) {
          errors++
          console.error('Batch message error:', e)
        }
      }

      return NextResponse.json({ status: 'done', saved, errors })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// Health check for webhook
export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'whatsapp-bridge' })
}
