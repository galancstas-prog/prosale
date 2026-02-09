'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { 
  WhatsAppSession, 
  WhatsAppChat, 
  WhatsAppMessage 
} from '@/lib/whatsapp/types'

// Bridge URL используется только для WebSocket (когда SSL настроен)
// Все REST вызовы идут через /api/whatsapp серверный прокси
const BRIDGE_URL = process.env.NEXT_PUBLIC_WA_BRIDGE_URL || ''

interface UseWhatsAppBridgeOptions {
  autoConnect?: boolean
  onNewMessage?: (message: WhatsAppMessage) => void
  onChatUpdate?: (chat: WhatsAppChat) => void
  onSessionUpdate?: (session: WhatsAppSession) => void
}

export function useWhatsAppBridge(options: UseWhatsAppBridgeOptions = {}) {
  const { autoConnect = true, onNewMessage, onChatUpdate, onSessionUpdate } = options
  
  const [isOnline, setIsOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  
  // Проверка здоровья bridge сервера (через серверный прокси)
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp?action=health')
      const data = await response.json()
      setIsOnline(data.status === 'online')
      setError(null)
      return data.status === 'online'
    } catch (err) {
      setIsOnline(false)
      setError('Не удаётся подключиться к WhatsApp Bridge')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Подключение WebSocket для real-time обновлений
  // Примечание: WebSocket напрямую к Bridge требует HTTPS/WSS для продакшна
  // На данном этапе используем polling через API route
  const connectSocket = useCallback(() => {
    if (!BRIDGE_URL || socketRef.current?.connected) return
    
    const socket = io(BRIDGE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    })
    
    socket.on('connect', () => {
      console.log('WebSocket connected to WhatsApp Bridge')
    })
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected from WhatsApp Bridge')
    })
    
    socket.on('message', (data) => {
      onNewMessage?.(data as WhatsAppMessage)
    })
    
    socket.on('chat_update', (data) => {
      onChatUpdate?.(data as WhatsAppChat)
    })
    
    socket.on('session_update', (data) => {
      onSessionUpdate?.(data as WhatsAppSession)
    })
    
    socket.on('qr', (data) => {
      // QR код обновился — диспатчим кастомный event
      window.dispatchEvent(new CustomEvent('whatsapp-qr', { detail: data }))
    })
    
    socketRef.current = socket
    
    return () => {
      socket.disconnect()
    }
  }, [onNewMessage, onChatUpdate, onSessionUpdate])
  
  // Создать новую сессию
  const createSession = useCallback(async (name?: string) => {
    try {
      setError(null)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          name
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create session')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])
  
  // Отключить сессию
  const disconnectSession = useCallback(async (sessionId: string) => {
    try {
      setError(null)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          sessionId
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disconnect session')
      }
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])
  
  // Отправить сообщение
  const sendMessage = useCallback(async (
    sessionId: string, 
    phone: string, 
    message: string,
    chatId?: string
  ) => {
    try {
      setError(null)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          sessionId,
          phone,
          message,
          chatId
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])
  
  // Получить все сессии
  const getSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp?action=sessions')
      
      if (!response.ok) {
        throw new Error('Failed to get sessions')
      }
      
      const data = await response.json()
      return data.sessions as WhatsAppSession[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return []
    }
  }, [])
  
  // Автоподключение при монтировании
  useEffect(() => {
    if (autoConnect) {
      checkHealth().then((online) => {
        if (online) {
          connectSocket()
        }
      })
    }
    
    return () => {
      socketRef.current?.disconnect()
    }
  }, [autoConnect, checkHealth, connectSocket])
  
  // Периодическая проверка здоровья
  useEffect(() => {
    const interval = setInterval(() => {
      checkHealth()
    }, 30000) // каждые 30 секунд
    
    return () => clearInterval(interval)
  }, [checkHealth])
  
  return {
    isOnline,
    isLoading,
    error,
    checkHealth,
    connectSocket,
    createSession,
    disconnectSession,
    sendMessage,
    getSessions
  }
}

// Хук для отслеживания QR кода
export function useWhatsAppQR(sessionId?: string) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'connected' | 'error'>('waiting')
  
  useEffect(() => {
    const handleQR = (event: CustomEvent<{ sessionId: string; qr: string }>) => {
      if (!sessionId || event.detail.sessionId === sessionId) {
        setQrCode(event.detail.qr)
        setStatus('scanning')
      }
    }
    
    const handleSessionUpdate = (event: CustomEvent<{ id: string; status: string }>) => {
      if (!sessionId || event.detail.id === sessionId) {
        if (event.detail.status === 'connected') {
          setStatus('connected')
          setQrCode(null)
        } else if (event.detail.status === 'error') {
          setStatus('error')
        }
      }
    }
    
    window.addEventListener('whatsapp-qr', handleQR as EventListener)
    window.addEventListener('whatsapp-session', handleSessionUpdate as EventListener)
    
    return () => {
      window.removeEventListener('whatsapp-qr', handleQR as EventListener)
      window.removeEventListener('whatsapp-session', handleSessionUpdate as EventListener)
    }
  }, [sessionId])
  
  return { qrCode, status }
}
