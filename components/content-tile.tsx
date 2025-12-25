import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface ContentTileProps {
  title: string
  description?: string
  href?: string
  icon?: LucideIcon
  iconColor?: string
  onClick?: () => void
}

export function ContentTile({ title, description, href, icon: Icon, iconColor, onClick }: ContentTileProps) {
  const content = (
    <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2">
      <CardHeader>
        {Icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${iconColor || 'bg-slate-100 dark:bg-slate-900'}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <CardTitle className="flex items-center justify-between">
          {title}
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  if (onClick) {
    return <div onClick={onClick}>{content}</div>
  }

  return content
}
