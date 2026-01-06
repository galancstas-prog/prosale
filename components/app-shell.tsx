'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LocaleProvider, useLocale } from '@/lib/i18n/use-locale'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getSupabaseClient } from '@/lib/supabase-client'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  FileText,
  Database,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
  user: {
    id: string
    email: string | null
  }
}

function AppShellContent({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLocale()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const navigation = [
    { name: t('nav.dashboard'), href: '/app', icon: LayoutDashboard },
    { name: t('nav.scripts'), href: '/app/scripts', icon: MessageSquare },
    { name: t('nav.training'), href: '/app/training', icon: BookOpen },
    { name: t('nav.faq'), href: '/app/faq', icon: FileText },
    { name: t('nav.knowledge'), href: '/app/knowledge', icon: Database },
  ]

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="text-xl font-bold">{t('landing.title')}</div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          <div className="border-t p-4 space-y-2">
            <div className="px-3 py-2 text-sm">
              <div className="font-medium">{user.email}</div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 lg:ml-0 ml-4">
            <div className="text-sm text-slate-500">{t('dashboard.workspace')}</div>
          </div>

          <LocaleSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  return (
    <LocaleProvider>
      <AppShellContent {...props} />
    </LocaleProvider>
  )
}