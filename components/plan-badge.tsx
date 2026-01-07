'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/hooks/use-tenant-plan'

interface PlanBadgeProps {
  plan: Plan
  daysLeft: number | null
}

export function PlanBadge({ plan, daysLeft }: PlanBadgeProps) {
  if (daysLeft === null) return null

  const colorClass =
    daysLeft <= 3
      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      : daysLeft <= 6
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'

  return (
    <Badge variant="outline" className={cn('font-normal', colorClass)}>
      Тариф: {plan} · Осталось {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
    </Badge>
  )
}
