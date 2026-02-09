'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { QrCode, Loader2, CheckCircle, XCircle, RefreshCw, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WhatsAppSession } from '@/lib/whatsapp/types'

interface QRCodeDisplayProps {
  session: WhatsAppSession
  onRefresh?: () => void
  className?: string
}

export function QRCodeDisplay({ session, onRefresh, className }: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!session.qr_expires_at) {
      setTimeLeft(null)
      return
    }

    const updateTimeLeft = () => {
      const expires = new Date(session.qr_expires_at!).getTime()
      const now = Date.now()
      const left = Math.max(0, Math.floor((expires - now) / 1000))
      setTimeLeft(left)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [session.qr_expires_at])

  const isExpired = timeLeft !== null && timeLeft <= 0

  // Status-based rendering
  if (session.status === 'connected') {
    return (
      <div className={cn('text-center p-8', className)}>
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          WhatsApp подключён
        </h3>
        <p className="text-sm text-slate-500 mb-1">
          Номер: <span className="font-medium">{session.phone_number || 'Определяется...'}</span>
        </p>
        <p className="text-xs text-slate-400">
          Сессия: {session.session_name}
        </p>
      </div>
    )
  }

  if (session.status === 'connecting') {
    return (
      <div className={cn('text-center p-8', className)}>
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Подключение...
        </h3>
        <p className="text-sm text-slate-500">
          Пожалуйста, подождите
        </p>
      </div>
    )
  }

  if (session.status === 'qr_pending' && session.qr_code && !isExpired) {
    return (
      <div className={cn('text-center p-6', className)}>
        {/* QR Code */}
        <div className="relative inline-block mb-4">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <img
              src={`data:image/png;base64,${session.qr_code}`}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
          
          {/* Timer overlay */}
          {timeLeft !== null && timeLeft <= 30 && (
            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-medium">
              {timeLeft}с
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Отсканируйте QR-код
        </h3>
        
        <div className="text-sm text-slate-500 space-y-1 mb-4">
          <p className="flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4" />
            Откройте WhatsApp на телефоне
          </p>
          <p>Настройки → Связанные устройства → Привязать устройство</p>
        </div>

        {timeLeft !== null && (
          <p className="text-xs text-slate-400">
            QR-код действителен ещё {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </p>
        )}
      </div>
    )
  }

  // Disconnected or expired
  return (
    <div className={cn('text-center p-8', className)}>
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
        {session.status === 'disconnected' ? (
          <QrCode className="w-10 h-10 text-slate-500" />
        ) : (
          <XCircle className="w-10 h-10 text-red-500" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {isExpired ? 'QR-код истёк' : 'WhatsApp отключён'}
      </h3>
      
      <p className="text-sm text-slate-500 mb-4">
        {isExpired 
          ? 'Запросите новый QR-код для подключения'
          : 'Нажмите кнопку ниже для получения QR-кода'
        }
      </p>

      <Button onClick={onRefresh} className="quick-action-btn primary">
        <RefreshCw className="w-4 h-4 mr-2" />
        {isExpired ? 'Обновить QR-код' : 'Подключить WhatsApp'}
      </Button>
    </div>
  )
}

interface ConnectionStatusProps {
  status: WhatsAppSession['status']
  phoneNumber?: string | null
  compact?: boolean
}

export function ConnectionStatus({ status, phoneNumber, compact }: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      color: 'bg-emerald-500',
      text: 'Подключён',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    connecting: {
      color: 'bg-blue-500 wa-animate-pulse',
      text: 'Подключение...',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    qr_pending: {
      color: 'bg-amber-500',
      text: 'Ожидание QR',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    disconnected: {
      color: 'bg-slate-400',
      text: 'Отключён',
      textColor: 'text-slate-500 dark:text-slate-400',
    },
  }

  const config = statusConfig[status]

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={cn('wa-status-dot', config.color)} />
        <span className={cn('text-xs font-medium', config.textColor)}>
          {config.text}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn('wa-status-dot', config.color)} />
      <div>
        <span className={cn('text-sm font-medium', config.textColor)}>
          {config.text}
        </span>
        {status === 'connected' && phoneNumber && (
          <span className="text-xs text-slate-500 ml-2">{phoneNumber}</span>
        )}
      </div>
    </div>
  )
}
