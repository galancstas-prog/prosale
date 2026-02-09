// WhatsApp Bridge Server
// Standalone Node.js server for WhatsApp Web connection via Baileys
// This runs separately from the Next.js app

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SESSIONS_DIR = process.env.WA_SESSIONS_DIR || './wa-sessions'

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Logger
const logger = pino({ level: 'info' })

// In-memory store for message caching
const store = makeInMemoryStore({ logger })

// Active connections map
const connections = new Map<string, ReturnType<typeof makeWASocket>>()

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

  // Load auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const { version, isLatest } = await fetchLatestBaileysVersion()

  logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)

  // Update session status in DB
  await updateSessionStatus(sessionId, 'connecting')

  // Create socket
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    getMessage: async (key) => {
      const msg = await store.loadMessage(key.remoteJid!, key.id!)
      return msg?.message || undefined
    },
  })

  store.bind(sock.ev)
  connections.set(sessionId, sock)

  // Connection update handler
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // Generate QR code as base64
      const qrBase64 = await QRCode.toDataURL(qr)
      const qrData = qrBase64.replace('data:image/png;base64,', '')

      // Update DB with QR code
      await supabase
        .from('whatsapp_sessions')
        .update({
          status: 'qr_pending',
          qr_code: qrData,
          qr_expires_at: new Date(Date.now() + 60000).toISOString(), // 60 sec
        })
        .eq('id', sessionId)

      // Emit to connected clients
      io.to(sessionId).emit('qr', { qr: qrData })

      logger.info(`QR code generated for session ${sessionId}`)
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      logger.info(`Connection closed for ${sessionId}, reconnect: ${shouldReconnect}`)

      await updateSessionStatus(sessionId, 'disconnected')
      connections.delete(sessionId)

      if (shouldReconnect) {
        // Retry connection
        setTimeout(() => connectToWhatsApp(sessionId), 5000)
      }
    }

    if (connection === 'open') {
      logger.info(`Connected to WhatsApp for session ${sessionId}`)

      const phoneNumber = sock.user?.id?.split(':')[0] || null

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

      io.to(sessionId).emit('connected', { phoneNumber })
    }
  })

  // Credentials update handler
  sock.ev.on('creds.update', saveCreds)

  // Messages handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message) continue

      const remoteJid = msg.key.remoteJid!
      const isFromMe = msg.key.fromMe

      // Skip status broadcasts
      if (remoteJid === 'status@broadcast') continue

      // Get or create chat
      const chat = await getOrCreateChat(sessionId, remoteJid, msg)

      // Extract message content
      const content = extractMessageContent(msg)

      // Save message to DB
      const { data: savedMessage } = await supabase
        .from('whatsapp_messages')
        .insert({
          chat_id: chat.id,
          tenant_id: chat.tenant_id,
          wa_message_id: msg.key.id,
          direction: isFromMe ? 'out' : 'in',
          content_type: content.type,
          content_text: content.text,
          content_media_url: content.mediaUrl,
          content_caption: content.caption,
          sender_jid: msg.key.participant || remoteJid,
          status: 'delivered',
        })
        .select()
        .single()

      // Update chat last message
      await supabase
        .from('whatsapp_chats')
        .update({
          last_message_text: content.text || `[${content.type}]`,
          last_message_at: new Date().toISOString(),
          last_message_direction: isFromMe ? 'out' : 'in',
          unread_count: isFromMe ? 0 : chat.unread_count + 1,
        })
        .eq('id', chat.id)

      // Emit new message event
      io.to(sessionId).emit('message', {
        message: savedMessage,
        chat,
      })

      logger.info(`New message in ${remoteJid}: ${content.text?.substring(0, 50)}...`)
    }
  })

  // Message status updates
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      if (update.update.status) {
        const statusMap: Record<number, string> = {
          2: 'sent',
          3: 'delivered',
          4: 'read',
        }

        await supabase
          .from('whatsapp_messages')
          .update({ status: statusMap[update.update.status] || 'sent' })
          .eq('wa_message_id', update.key.id)
      }
    }
  })

  return sock
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateSessionStatus(sessionId: string, status: string) {
  await supabase
    .from('whatsapp_sessions')
    .update({ status })
    .eq('id', sessionId)
}

async function getOrCreateChat(sessionId: string, remoteJid: string, msg: any) {
  // Get session to find tenant_id
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('tenant_id')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('Session not found')

  // Try to find existing chat
  const { data: existingChat } = await supabase
    .from('whatsapp_chats')
    .select('*')
    .eq('session_id', sessionId)
    .eq('remote_jid', remoteJid)
    .single()

  if (existingChat) return existingChat

  // Extract contact info
  const phoneNumber = remoteJid.split('@')[0]
  const contactName = msg.pushName || null

  // Create new chat
  const { data: newChat } = await supabase
    .from('whatsapp_chats')
    .insert({
      session_id: sessionId,
      tenant_id: session.tenant_id,
      remote_jid: remoteJid,
      contact_phone: phoneNumber,
      contact_name: contactName,
      status: 'open',
    })
    .select()
    .single()

  return newChat
}

function extractMessageContent(msg: any): {
  type: string
  text: string | null
  mediaUrl: string | null
  caption: string | null
} {
  const message = msg.message

  if (message?.conversation) {
    return { type: 'text', text: message.conversation, mediaUrl: null, caption: null }
  }

  if (message?.extendedTextMessage) {
    return { type: 'text', text: message.extendedTextMessage.text, mediaUrl: null, caption: null }
  }

  if (message?.imageMessage) {
    return {
      type: 'image',
      text: null,
      mediaUrl: null, // Would need to download and upload to storage
      caption: message.imageMessage.caption || null,
    }
  }

  if (message?.videoMessage) {
    return {
      type: 'video',
      text: null,
      mediaUrl: null,
      caption: message.videoMessage.caption || null,
    }
  }

  if (message?.audioMessage) {
    return { type: 'audio', text: null, mediaUrl: null, caption: null }
  }

  if (message?.documentMessage) {
    return {
      type: 'document',
      text: message.documentMessage.fileName || null,
      mediaUrl: null,
      caption: message.documentMessage.caption || null,
    }
  }

  if (message?.stickerMessage) {
    return { type: 'sticker', text: null, mediaUrl: null, caption: null }
  }

  return { type: 'unknown', text: null, mediaUrl: null, caption: null }
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: connections.size,
    uptime: process.uptime(),
  })
})

// Connect session
app.post('/sessions/:sessionId/connect', async (req, res) => {
  const { sessionId } = req.params

  try {
    if (connections.has(sessionId)) {
      return res.json({ status: 'already_connected' })
    }

    await connectToWhatsApp(sessionId)
    res.json({ status: 'connecting' })
  } catch (error: any) {
    logger.error(`Failed to connect session ${sessionId}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Disconnect session
app.post('/sessions/:sessionId/disconnect', async (req, res) => {
  const { sessionId } = req.params

  try {
    const sock = connections.get(sessionId)
    if (sock) {
      await sock.logout()
      connections.delete(sessionId)
    }

    await updateSessionStatus(sessionId, 'disconnected')
    res.json({ status: 'disconnected' })
  } catch (error: any) {
    logger.error(`Failed to disconnect session ${sessionId}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Send message
app.post('/sessions/:sessionId/send', async (req, res) => {
  const { sessionId } = req.params
  const { chatId, text, mediaUrl, mediaType } = req.body

  try {
    const sock = connections.get(sessionId)
    if (!sock) {
      return res.status(400).json({ error: 'Session not connected' })
    }

    // Get chat remote_jid
    const { data: chat } = await supabase
      .from('whatsapp_chats')
      .select('remote_jid')
      .eq('id', chatId)
      .single()

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' })
    }

    let sentMsg

    if (text) {
      sentMsg = await sock.sendMessage(chat.remote_jid, { text })
    } else if (mediaUrl) {
      // Handle media messages
      sentMsg = await sock.sendMessage(chat.remote_jid, {
        [mediaType]: { url: mediaUrl },
      })
    }

    res.json({ messageId: sentMsg?.key?.id })
  } catch (error: any) {
    logger.error(`Failed to send message:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Get session status
app.get('/sessions/:sessionId/status', async (req, res) => {
  const { sessionId } = req.params

  const isConnected = connections.has(sessionId)
  const sock = connections.get(sessionId)

  res.json({
    connected: isConnected,
    phoneNumber: sock?.user?.id?.split(':')[0] || null,
  })
})

// ============================================
// SOCKET.IO HANDLERS
// ============================================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on('subscribe', (sessionId: string) => {
    socket.join(sessionId)
    logger.info(`Client ${socket.id} subscribed to session ${sessionId}`)
  })

  socket.on('unsubscribe', (sessionId: string) => {
    socket.leave(sessionId)
  })

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// ============================================
// STARTUP
// ============================================

async function startup() {
  // Load all active sessions from DB and reconnect
  const { data: sessions } = await supabase
    .from('whatsapp_sessions')
    .select('id')
    .eq('status', 'connected')

  if (sessions) {
    for (const session of sessions) {
      logger.info(`Reconnecting session: ${session.id}`)
      try {
        await connectToWhatsApp(session.id)
      } catch (error) {
        logger.error(`Failed to reconnect session ${session.id}:`, error)
      }
    }
  }

  httpServer.listen(PORT, () => {
    logger.info(`WhatsApp Bridge Server running on port ${PORT}`)
  })
}

startup().catch((error) => {
  logger.error('Startup failed:', error)
  process.exit(1)
})
