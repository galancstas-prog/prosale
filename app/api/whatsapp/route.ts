import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const BRIDGE_URL = process.env.NEXT_PUBLIC_WA_BRIDGE_URL || 'http://localhost:3001'

// Helper для проверки авторизации и получения текущего тенанта
async function getCurrentTenant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  // Получаем tenant_id пользователя
  const { data: member } = await supabase
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single()
  
  if (!member) {
    throw new Error('No tenant membership found')
  }
  
  return {
    userId: user.id,
    tenantId: member.tenant_id,
    role: member.role
  }
}

// GET - получить статус bridge или сессии
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const sessionId = searchParams.get('sessionId')
    
    const { tenantId } = await getCurrentTenant()
    
    if (action === 'health') {
      // Проверка здоровья bridge сервера
      const response = await fetch(`${BRIDGE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        return NextResponse.json({ 
          status: 'offline',
          message: 'WhatsApp Bridge недоступен' 
        }, { status: 503 })
      }
      
      const data = await response.json()
      return NextResponse.json({ status: 'online', ...data })
    }
    
    if (action === 'sessions') {
      // Получить все сессии тенанта
      const supabase = await createClient()
      const { data: sessions, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return NextResponse.json({ sessions })
    }
    
    if (action === 'status' && sessionId) {
      // Получить статус конкретной сессии
      const response = await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: 'Failed to get session status' 
        }, { status: response.status })
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// POST - действия с сессиями и сообщениями
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, phone, message, chatId } = body
    
    const { userId, tenantId, role } = await getCurrentTenant()
    
    if (action === 'connect') {
      // Создать новую сессию и получить QR код
      const supabase = await createClient()
      
      // Создаём запись сессии в БД
      const { data: session, error: dbError } = await supabase
        .from('whatsapp_sessions')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          name: body.name || 'WhatsApp',
          status: 'connecting'
        })
        .select()
        .single()
      
      if (dbError) throw dbError
      
      // Запрашиваем QR у bridge
      const response = await fetch(`${BRIDGE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          tenantId
        })
      })
      
      if (!response.ok) {
        // Откатываем создание сессии при ошибке
        await supabase
          .from('whatsapp_sessions')
          .delete()
          .eq('id', session.id)
        
        throw new Error('Failed to connect to WhatsApp Bridge')
      }
      
      const data = await response.json()
      return NextResponse.json({
        sessionId: session.id,
        qr: data.qr,
        status: 'connecting'
      })
    }
    
    if (action === 'disconnect' && sessionId) {
      // Проверяем права на сессию
      const supabase = await createClient()
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .single()
      
      // Только владелец сессии или ADMIN/OWNER может отключить
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      
      if (session.user_id !== userId && !['ADMIN', 'OWNER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      // Отключаем сессию на bridge
      const response = await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      // Обновляем статус в БД
      await supabase
        .from('whatsapp_sessions')
        .update({ status: 'disconnected' })
        .eq('id', sessionId)
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'send' && sessionId && phone && message) {
      // Отправить сообщение
      const response = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message,
          chatId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await response.json()
      
      // Сохраняем сообщение в БД
      const supabase = await createClient()
      
      // Находим или создаём чат
      let chatRecord: { id: string } | null = null
      
      if (chatId) {
        const { data } = await supabase
          .from('whatsapp_chats')
          .select('id')
          .eq('id', chatId)
          .single()
        chatRecord = data
      }
      
      if (!chatRecord) {
        const { data } = await supabase
          .from('whatsapp_chats')
          .upsert({
            session_id: sessionId,
            remote_jid: `${phone}@s.whatsapp.net`,
            phone_number: phone,
            tenant_id: tenantId
          }, {
            onConflict: 'session_id,remote_jid'
          })
          .select('id')
          .single()
        chatRecord = data
      }
      
      if (chatRecord) {
        await supabase
          .from('whatsapp_messages')
          .insert({
            chat_id: chatRecord.id,
            wa_message_id: data.messageId,
            direction: 'outgoing',
            content: message,
            content_type: 'text',
            status: 'sent',
            tenant_id: tenantId
          })
        
        // Обновляем last_message в чате
        await supabase
          .from('whatsapp_chats')
          .update({
            last_message: message,
            last_message_at: new Date().toISOString()
          })
          .eq('id', chatRecord.id)
      }
      
      return NextResponse.json({ 
        success: true,
        messageId: data.messageId 
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
