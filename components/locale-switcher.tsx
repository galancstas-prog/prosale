'use client'

import { useLocale } from '@/lib/i18n/use-locale'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
    >
      <Languages className="h-4 w-4 mr-2" />
      {locale === 'en' ? 'EN' : 'RU'}
    </Button>
  )
}
