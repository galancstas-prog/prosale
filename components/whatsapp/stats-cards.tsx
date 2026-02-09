'use client'

import { cn } from '@/lib/utils'
import { 
  MessageCircle, 
  Users, 
  Clock, 
  TrendingUp,
  Zap,
  Phone
} from 'lucide-react'
import type { WhatsAppStats } from '@/lib/whatsapp/types'

interface StatsCardsProps {
  stats: WhatsAppStats
  className?: string
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  const cards = [
    {
      title: 'Всего чатов',
      value: stats.total_chats,
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20',
    },
    {
      title: 'Открытых',
      value: stats.open_chats,
      icon: Clock,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20',
    },
    {
      title: 'Без менеджера',
      value: stats.unassigned_chats,
      icon: Users,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20',
      highlight: stats.unassigned_chats > 0,
    },
    {
      title: 'Сообщений сегодня',
      value: stats.total_messages_today,
      icon: TrendingUp,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20',
    },
    {
      title: 'Активных сессий',
      value: stats.connected_sessions,
      icon: Phone,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20',
    },
  ]

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4', className)}>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={cn(
              'stats-card relative overflow-hidden',
              card.highlight && 'ring-2 ring-amber-500/50'
            )}
          >
            {/* Background gradient */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-50',
              card.bgColor
            )} />
            
            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
                  card.color
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.highlight && (
                  <Zap className="w-4 h-4 text-amber-500" />
                )}
              </div>
              
              <div className="stats-value">{card.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {card.title}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface MiniStatsProps {
  openChats: number
  unreadCount: number
  className?: string
}

export function MiniStats({ openChats, unreadCount, className }: MiniStatsProps) {
  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-1.5">
        <MessageCircle className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600 dark:text-slate-300">{openChats} открытых</span>
      </div>
      {unreadCount > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {unreadCount} непрочитанных
          </span>
        </div>
      )}
    </div>
  )
}
