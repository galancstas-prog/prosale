'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMembership } from '@/lib/auth/use-membership'
import { useTenantPlan } from '@/lib/hooks/use-tenant-plan'
import { Check, Sparkles } from 'lucide-react'

export default function BillingPage() {
  const { membership, loading: membershipLoading } = useMembership()
  const { plan, loading: planLoading } = useTenantPlan()
  const router = useRouter()

  useEffect(() => {
    if (!membershipLoading && membership?.role !== 'ADMIN') {
      router.replace('/app')
    }
  }, [membership, membershipLoading, router])

  if (membershipLoading || planLoading) {
    return <div>Loading...</div>
  }

  if (membership?.role !== 'ADMIN') {
    return null
  }

  const handleUpgrade = () => {
    window.open('https://wa.me/77086807424', '_blank')
  }

  const plans = [
    {
      name: 'MINI',
      price: '2.990 ₸',
      features: [
        '1 администратор',
        '2 менеджера',
        'Поиск по базе знаний',
        'Скрипты продаж',
        'База знаний',
      ],
      disabled: ['AI поиск'],
    },
    {
      name: 'PRO',
      price: '5.490 ₸',
      features: [
        '1 администратор',
        '5 менеджеров',
        'Поиск по базе знаний',
        'AI поиск',
        'Скрипты продаж',
        'База знаний',
      ],
      disabled: [],
      popular: true,
    },
    {
      name: 'TEAM',
      price: '11.490 ₸',
      features: [
        '1 администратор',
        '10 менеджеров',
        'Поиск по базе знаний',
        'AI поиск',
        'Скрипты продаж',
        'База знаний',
        'Приоритетная поддержка',
      ],
      disabled: [],
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Тарифы</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Выберите подходящий тариф для вашей команды
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((planItem) => {
          const isCurrent = plan === planItem.name
          return (
            <Card
              key={planItem.name}
              className={`relative ${
                planItem.popular
                  ? 'border-blue-500 shadow-lg'
                  : isCurrent
                  ? 'border-green-500'
                  : ''
              }`}
            >
              {planItem.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Популярный</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-600 text-white">Текущий тариф</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{planItem.name}</span>
                  {planItem.name !== 'MINI' && (
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {planItem.price}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400"> / месяц</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {planItem.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {planItem.disabled.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 opacity-50">
                      <Check className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleUpgrade}
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Текущий тариф' : 'Сменить тариф'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Нужна помощь?</CardTitle>
          <CardDescription>
            Свяжитесь с нами в WhatsApp для получения консультации по тарифам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpgrade} variant="outline">
            Написать в WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
