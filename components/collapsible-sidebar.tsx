'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCollapsiblePanel } from '@/lib/hooks/use-collapsible-panel'

interface CollapsibleSidebarProps {
  panelId: string
  children: ReactNode
  title?: string
  className?: string
}

export function CollapsibleSidebar({ panelId, children, title, className }: CollapsibleSidebarProps) {
  const { isCollapsed, toggleCollapsed, isLoaded } = useCollapsiblePanel(panelId)

  // Предотвращаем мерцание при гидратации
  if (!isLoaded) {
    return (
      <Card className={cn('p-4 h-full transition-all duration-300', className)}>
        {title && <h3 className="font-semibold mb-4 text-base">{title}</h3>}
        {children}
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'p-4 h-full transition-all duration-300 relative',
        isCollapsed ? 'w-12 min-w-12 overflow-hidden' : '',
        className
      )}
    >
      {/* Кнопка сворачивания */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCollapsed}
        className={cn(
          'absolute top-2 z-10 h-7 w-7 p-0',
          isCollapsed ? 'right-2' : 'right-2'
        )}
        title={isCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Контент */}
      <div
        className={cn(
          'transition-all duration-300',
          isCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100 visible'
        )}
      >
        {title && <h3 className="font-semibold mb-4 text-base pr-8">{title}</h3>}
        {children}
      </div>

      {/* Вертикальный текст при свёрнутом состоянии */}
      {isCollapsed && title && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <span
            className="text-xs font-medium text-muted-foreground whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            {title}
          </span>
        </div>
      )}
    </Card>
  )
}
