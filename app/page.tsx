'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLocale, LocaleProvider } from '@/lib/i18n/use-locale'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { BookOpen, MessageSquare, FileText, Database } from 'lucide-react'

function LandingPageContent() {
  const { t } = useLocale()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {t('landing.title')}
          </div>
          <div className="flex gap-4 items-center">
            <LocaleSwitcher />
            <Link href="/login">
              <Button variant="ghost">{t('landing.login')}</Button>
            </Link>
            <Link href="/register">
              <Button>{t('landing.register')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {t('landing.title')}
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            {t('landing.subtitle')}
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                {t('landing.register')}
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                {t('landing.login')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:shadow-lg transition-all hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>{t('dashboard.scripts')}</CardTitle>
              <CardDescription>
                Manage conversation scripts and templates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>{t('dashboard.training')}</CardTitle>
              <CardDescription>
                Access training materials and track progress
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>{t('dashboard.faq')}</CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center mb-2">
                <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>{t('dashboard.knowledge')}</CardTitle>
              <CardDescription>
                Comprehensive knowledge base articles
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <footer className="border-t mt-20 py-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
          <p>© 2024 {t('landing.title')}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <LocaleProvider>
      <LandingPageContent />
    </LocaleProvider>
  )
}
