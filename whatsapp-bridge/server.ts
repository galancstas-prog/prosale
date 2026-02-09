// WhatsApp Bridge Server
// Standalone Node.js server for WhatsApp Web connection via Baileys
// This runs separately from the Next.js app

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import QRCode from 'qrcode'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'
import path from 'path'
import fs from 'fs'

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.WA_BRIDGE_PORT || 3001
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SESSIONS_DIR = process.env.WA_SESSIONS_DIR || './wa-sessions'

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

// Initialize Supabase client (optional)
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const logger = pino({ level: 'info' })

// Active connections and QR codes in memory
const connections = new Map<string, any>()
const qrCodes = new Map<string, { qr: string; expiresAt: number }>()
const sessionStatuses = new Map<string, string>()

// ============================================
// EXPRESS + SOCKET.IO SETUP
// ============================================

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

// ============================================
// WHATSAPP CONNECTION HANDLER
// ============================================

async function connectToWhatsApp(sessionId: string) {
  const sessionPath = path.join(SESSIONS_DIR, sessionId)

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const { version } = await fetchLatestBaileysVersion()

  logger.info(`Connecting session ${sessionId}, WA v${version.join('.')}`)

  sessionStatuses.set(sessionId, 'connecting')
  await updateSessionStatusDB(sessionId, 'connecting')

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    getMessage: async () => undefined,
  })

  connections.set(sessionId, sock)

  // Connection update handler
  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // Generate QR code as base64
      const qrBase64 = await QRCode.toDataURL(qr)
      const qrData = qrBase64.replace('data:image/png;base64,', '')

      // Store QR in memory (available via HTTP GET)
      qrCodes.set(sessionId, {
        qr: qrData,
        expiresAt: Date.now() + 60000,
      })
      sessionStatuses.set(sessionId, 'qr_pending')

      // Also try to update DB if Supabase is configured
      await updateSessionStatusDB(sessionId, 'qr_pending', qrData)

      // Emit to WebSocket clients
      io.to(sessionId).emit('qr', { sessionId, qr: qrData })

      logger.info(`QR code generated for session ${sessionId}`)
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      logger.info(`Connection closed for ${sessionId}, reconnect: ${shouldReconnect}`)

      sessionStatuses.set(sessionId, 'disconnected')
      qrCodes.delete(sessionId)
      connections.delete(sessionId)
      await updateSessionStatusDB(sessionId, 'disconnected')

      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(sessionId), 5000)
      }
    }

    if (connection === 'open') {
      logger.info(`Connected to WhatsApp for session ${sessionId}`)

      const phoneNumber = sock.user?.id?.split(':')[0] || null
      sessionStatuses.set(sessionId, 'connected')
      qrCodes.delete(sessionId)

      if (supabase) {
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'connected',
            phone_number: phoneNumber,
            qr_code: null,
            qr_expires_at: null,
            last_connected_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
      }

      io.to(sessionId).emit('connected', { sessionId, phoneNumber })
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // Messages handler
  sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message) continue
      const remoteJid = msg.key.remoteJid!
      if (remoteJid === 'status@broadcast') continue

      const isFromMe = msg.key.fromMe
      const chat = await getOrCreateChat(sessionId, remoteJid, msg)
      if (!chat) continue

      const content = extractMessageContent(msg)

      if (supabase) {
        const { data: savedMessage } = await supabase
          .from('whatsapp_messages')
          .insert({
            chat_id: chat.id,
            tenant_id: chat.tenant_id,
            wa_message_id: msg.key.id,
            direction: isFromMe ? 'out' : 'in',
            content_type: content.type,
            content_text: content.text,
            sender_jid: msg.key.participant || remoteJid,
            status: 'delivered',
          })
          .select()
          .single()

        await supabase
          .from('whatsapp_chats')
          .update({
            last_message_text: content.text || '[' + content.type + ']',
            last_message_at: new Date().toISOString(),
            last_message_direction: isFromMe ? 'out' : 'in',
            unread_count: isFromMe ? 0 : (chat.unread_count || 0) + 1,
          })
          .eq('id', chat.id)

        io.to(sessionId).emit('message', { message: savedMessage, chat })
      }

      logger.info('New message in ' + remoteJid)
    }
  })

  return sock
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateSessionStatusDB(sessionId: string, status: string, qrData?: string) {
  if (!supabase) return
  try {
    const updateData: any = { status }
    if (qrData) {
      updateData.qr_code = qrData
      updateData.qr_expires_at = new Date(Date.now() + 60000).toISOString()
    }
    await supabase.from('whatsapp_sessions').update(updateData).eq('id', sessionId)
  } catch (e) {
    logger.warn('Failed to update session status in DB: ' + e)
  }
}

async function getOrCreateChat(sessionId: string, remoteJid: string, msg: any) {
  if (!supabase) return null

  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('tenant_id')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const { data: existingChat } = await supabase
    .from('whatsapp_chats')
    .select('*')
    .eq('session_id', sessionId)
    .eq('remote_jid', remoteJid)
    .single()

  if (existingChat) return existingChat

  const { data: newChat } = await supabase
    .from('whatsapp_chats')
    .insert({
      session_id: sessionId,
      tenant_id: session.tenant_id,
      remote_jid: remoteJid,
      contact_phone: remoteJid.split('@')[0],
      contact_name: msg.pushName || null,
      status: 'open',
    })
    .select()
    .single()

  return newChat
}

function extractMessageContent(msg: any) {
  const m = msg.message
  if (m?.conversation) return { type: 'text', text: m.conversation }
  if (m?.extendedTextMessage) return { type: 'text', text: m.extendedTextMessage.text }
  if (m?.imageMessage) return { type: 'image', text: null }
  if (m?.videoMessage) return { type: 'video', text: null }
  if (m?.audioMessage) return { type: 'audio', text: null }
  if (m?.documentMessage) return { type: 'document', text: m.documentMessage.fileName }
  return { type: 'unknown', text: null }
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connections: connections.size,
    uptime: process.uptime(),
  })
})

// Connect session (start WhatsApp connection, returns immediately)
app.post('/sessions/:sessionId/connect', async (req, res) => {
  const { sessionId } = req.params

  try {
    if (connections.has(sessionId)) {
      return res.json({ status: 'already_connected' })
    }

    // Start connection (async - QR will come later)
    connectToWhatsApp(sessionId).catch((e) => {
      logger.error('Background connect error for ' + sessionId + ': ' + e.message)
    })

    res.json({ status: 'connecting' })
  } catch (error: any) {
    logger.error('Failed to connect session ' + sessionId, error)
    res.status(500).json({ error: error.message })
  }
})

// GET QR code for a session (polling endpoint)
app.get('/sessions/:sessionId/qr', (req, res) => {
  const { sessionId } = req.params
  const qrData = qrCodes.get(sessionId)
  const status = sessionStatuses.get(sessionId) || 'unknown'

  if (qrData && qrData.expiresAt > Date.now()) {
    return res.json({
      status: 'qr_pending',
      qr: qrData.qr,
      expiresAt: new Date(qrData.expiresAt).toISOString(),
    })
  }

  if (status === 'connected') {
    const sock = connections.get(sessionId)
    return res.json({
      status: 'connected',
      phoneNumber: sock?.user?.id?.split(':')[0] || null,
    })
  }

  res.json({ status })
})

// Create and connect session (POST /sessions)
app.post('/sessions', async (req, res) => {
  const { sessionId } = req.body

  try {
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    if (connections.has(sessionId)) {
      return res.json({ status: 'already_connected' })
    }

    connectToWhatsApp(sessionId).catch((e) => {
      logger.error('Background connect error: ' + e.message)
    })

    res.json({ status: 'connecting', sessionId })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Disconnect session
app.post('/sessions/:sessionId/disconnect', async (req, res) => {
  const { sessionId } = req.params

  try {
    const sock = connections.get(sessionId)
    if (sock) {
      try { await sock.logout() } catch (_e) { /* ignore */ }
      connections.delete(sessionId)
    }
    qrCodes.delete(sessionId)
    sessionStatuses.set(sessionId, 'disconnected')
    await updateSessionStatusDB(sessionId, 'disconnected')
    res.json({ status: 'disconnected' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete session
app.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params

  try {
    const sock = connections.get(sessionId)
    if (sock) {
      try { await sock.logout() } catch (_e) { /* ignore */ }
      connections.delete(sessionId)
    }
    qrCodes.delete(sessionId)
    sessionStatuses.delete(sessionId)

    const sessionPath = path.join(SESSIONS_DIR, sessionId)
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
    }

    await updateSessionStatusDB(sessionId, 'disconnected')
    res.json({ status: 'deleted' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Send message
app.post('/sessions/:sessionId/send', async (req, res) => {
  const { sessionId } = req.params
  const { chatId, text, phone, message } = req.body

  try {
    const sock = connections.get(sessionId)
    if (!sock) {
      return res.status(400).json({ error: 'Session not connected' })
    }

    let remoteJid: string | null = null

    if (chatId && supabase) {
      const { data: chat } = await supabase
        .from('whatsapp_chats')
        .select('remote_jid')
        .eq('id', chatId)
        .single()
      remoteJid = chat?.remote_jid || null
    }

    if (!remoteJid && phone) {
      remoteJid = phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    if (!remoteJid) {
      return res.status(400).json({ error: 'No recipient specified' })
    }

    const messageText = text || message
    let sentMsg: any

    if (messageText) {
      sentMsg = await sock.sendMessage(remoteJid, { text: messageText })
    }

    res.json({ messageId: sentMsg?.key?.id })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get session status
app.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const status = sessionStatuses.get(sessionId) || 'disconnected'
  const sock = connections.get(sessionId)

  res.json({
    status,
    connected: connections.has(sessionId),
    phoneNumber: sock?.user?.id?.split(':')[0] || null,
  })
})

app.get('/sessions/:sessionId/status', (req, res) => {
  const { sessionId } = req.params
  const status = sessionStatuses.get(sessionId) || 'disconnected'
  const sock = connections.get(sessionId)

  res.json({
    status,
    connected: connections.has(sessionId),
    phoneNumber: sock?.user?.id?.split(':')[0] || null,
  })
})

// ============================================
// SOCKET.IO HANDLERS
// ============================================

io.on('connection', (socket) => {
  logger.info('Client connected: ' + socket.id)

  socket.on('subscribe', (sessionId: string) => {
    socket.join(sessionId)
    logger.info('Client ' + socket.id + ' subscribed to ' + sessionId)
  })

  socket.on('unsubscribe', (sessionId: string) => {
    socket.leave(sessionId)
  })

  socket.on('disconnect', () => {
    logger.info('Client disconnected: ' + socket.id)
  })
})

// ============================================
// STARTUP
// ============================================

async function startup() {
  if (supabase) {
    const { data: sessions } = await supabase
      .from('whatsapp_sessions')
      .select('id')
      .eq('status', 'connected')

    if (sessions) {
      for (const session of sessions) {
        logger.info('Reconnecting session: ' + session.id)
        try {
          await connectToWhatsApp(session.id)
        } catch (error) {
          logger.error('Failed to reconnect ' + session.id)
        }
      }
    }
  }

  httpServer.listen(PORT, () => {
    logger.info('WhatsApp Bridge Server running on port ' + PORT)
  })
}

startup().catch((error) => {
  logger.error('Startup failed:', error)
  process.exit(1)
})
