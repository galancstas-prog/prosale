'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Check, Sparkles, Search, Database, MessageSquare, BookOpen, FileText, Brain, Zap, Users, Building2, TrendingUp, Headphones, ArrowDown, Clock, Target } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { useState } from 'react'
import Image from 'next/image'

export default function Landing() {
  const [currency, setCurrency] = useState<'KZT' | 'RUB' | 'USD'>('KZT')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  const pricing = {
    KZT: { mini: '2 490', pro: '5 490', team: '11 490', individual: '79 900' },
    RUB: { mini: '499', pro: '1 099', team: '2 299', individual: '29 990' },
    USD: { mini: '5', pro: '11', team: '23', individual: '159' }
  } as const

  const currencySymbol = { KZT: '₸', RUB: '₽', USD: '$' } as const

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="text-xl font-bold" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
            SalesPilot
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <button onClick={() => scrollToSection('product')} className="text-slate-600 hover:text-slate-900 transition-colors">
              Продукт
            </button>
            <button onClick={() => scrollToSection('features')} className="text-slate-600 hover:text-slate-900 transition-colors">
              Функции
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-slate-600 hover:text-slate-900 transition-colors">
              Тарифы
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/register">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl">
                Получить демо
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="rounded-xl hidden sm:flex">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h1
                  className="text-5xl md:text-7xl lg:text-[68px] font-bold leading-[1.05] text-slate-900"
                  style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                >
                  SalesPilot<br />
                  <span className="text-slate-700">Единый источник ответов для отдела продаж</span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-xl">
                  Скрипты, FAQ, база знаний и обучение — в одной системе.
                  Менеджер получает точный ответ за секунды прямо в момент диалога.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="h-5 w-5 text-[#4F46E5]" />
                    <span>Быстрее ответы → меньше «я уточню и вернусь»</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="h-5 w-5 text-[#4F46E5]" />
                    <span>Единый стандарт → новички отвечают как сильные менеджеры</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="h-5 w-5 text-[#4F46E5]" />
                    <span>База растёт из реальных вопросов клиентов</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-lg px-10 py-6 w-full sm:w-auto">
                      Запустить демо на 3 дня
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl text-lg px-10 py-6 w-full sm:w-auto"
                    onClick={() => scrollToSection('features')}
                  >
                    Посмотреть функции
                  </Button>
                </div>

                <p className="text-sm text-slate-500">
                  Без карты • Полный доступ • PRO-тариф
                </p>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Используется отделами продаж, где скорость ответа важнее «идеального скрипта».
                  </p>
                </div>
              </div>

              {/* AI Cards Composition */}
              <div className="relative h-[400px] lg:h-[500px] hidden lg:flex items-center justify-center">
                {/* Background gradient blob */}
                <div
                  className="absolute inset-0 rounded-[40px] opacity-[0.18]"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #06B6D4 100%)',
                    filter: 'blur(80px)',
                    animation: 'float 10s ease-in-out infinite'
                  }}
                />

                {/* AI Cards Stack */}
                <div className="relative w-full max-w-md space-y-4 px-4">
                  {/* Card 1 - Question */}
                  <Card
                    className="border border-slate-200 shadow-lg bg-white"
                    style={{
                      transform: 'rotate(-2deg) translateX(-10px)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="text-xs font-semibold text-slate-500 mb-2">Вопрос клиента</div>
                      <p className="text-sm text-slate-700">— Почему у вас дороже?</p>
                    </CardContent>
                  </Card>

                  {/* Card 2 - Answer (main) */}
                  <Card
                    className="border-2 border-[#4F46E5] shadow-xl bg-white relative z-10"
                    style={{
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="text-xs font-semibold text-[#4F46E5] mb-3">Ответ SalesPilot</div>
                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          — Цена выше из-за расширенной гарантии и SLA.
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          — Вот как это объяснить клиенту…
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Источник: FAQ → Цена
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Card 3 - Usage */}
                  <Card
                    className="border border-slate-200 shadow-lg bg-white"
                    style={{
                      transform: 'rotate(2deg) translateX(10px)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="text-xs font-semibold text-slate-500 mb-2">Использовано</div>
                      <p className="text-sm text-slate-700">Использовано в 12 диалогах</p>
                    </CardContent>
                  </Card>
                </div>

                <style jsx>{`
                  @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(30px, -30px) rotate(5deg); }
                    66% { transform: translate(-20px, 20px) rotate(-5deg); }
                  }
                  @media (prefers-reduced-motion: reduce) {
                    * { animation-duration: 0.01ms !important; }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Strip */}
        <section className="border-y bg-slate-50 overflow-hidden">
          <div className="py-3">
            <div className="marquee-content flex items-center gap-8 whitespace-nowrap text-sm text-slate-600">
              <span>Без CRM</span>
              <span className="text-slate-300">•</span>
              <span>Без перестройки процессов</span>
              <span className="text-slate-300">•</span>
              <span>Работает поверх текущих инструментов</span>
              <span className="text-slate-300">•</span>
              <span>Ничего лишнего</span>
              <span className="text-slate-300">•</span>
              <span>Никаких лимитов на поиск</span>
              <span className="text-slate-300">•</span>
              <span>Без CRM</span>
              <span className="text-slate-300">•</span>
              <span>Без перестройки процессов</span>
              <span className="text-slate-300">•</span>
              <span>Работает поверх текущих инструментов</span>
              <span className="text-slate-300">•</span>
              <span>Ничего лишнего</span>
              <span className="text-slate-300">•</span>
              <span>Никаких лимитов на поиск</span>
            </div>
          </div>
          <style jsx>{`
            .marquee-content {
              animation: marquee 30s linear infinite;
            }
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @media (prefers-reduced-motion: reduce) {
              .marquee-content { animation: none; }
            }
          `}</style>
        </section>

        {/* What is it + How it works */}
        <section id="product" className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2
                className="text-4xl md:text-5xl lg:text-[60px] font-bold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Это не CRM.<br />
                Это Sales OS: знания → ответы → сделки.
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-3">
                SalesPilot — это слой знаний и ответов, который подключается к вашему отделу продаж и начинает работать сразу.
              </p>
            </div>

            {/* Sales OS Diagram */}
            <div className="mb-10 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  <Card className="border border-slate-200 bg-white">
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-5 w-5 text-[#4F46E5] mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-700">Скрипты</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-5 w-5 text-[#4F46E5] mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-700">FAQ</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white">
                    <CardContent className="p-4 text-center">
                      <BookOpen className="h-5 w-5 text-[#4F46E5] mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-700">Обучение</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white">
                    <CardContent className="p-4 text-center">
                      <Database className="h-5 w-5 text-[#4F46E5] mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-700">База знаний</p>
                    </CardContent>
                  </Card>
                </div>

                <ArrowDown className="h-6 w-6 text-[#4F46E5]" />

                <Card className="border-2 border-[#4F46E5] bg-white w-full md:w-auto">
                  <CardContent className="p-6 text-center">
                    <Brain className="h-8 w-8 text-[#4F46E5] mx-auto mb-2" />
                    <p className="font-bold text-slate-900">SalesPilot</p>
                  </CardContent>
                </Card>

                <ArrowDown className="h-6 w-6 text-[#4F46E5]" />

                <Card className="border border-slate-200 bg-white w-full md:w-auto">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium text-slate-700">Готовый ответ менеджеру</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border border-slate-200 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
                    <Database className="h-6 w-6 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">1. Собираете знания</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Скрипты, FAQ, база знаний, обучение.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
                    <Search className="h-6 w-6 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">2. Менеджер задаёт вопрос</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Через поиск или AI-поиск.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">3. SalesPilot отвечает</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Готовый текст + источники внутри системы.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
               <div className="relative w-full aspect-[16/9] bg-slate-100">
  <Image
    src="/dashboard_placeholder.png"
    alt="Dashboard preview"
    fill
    className="object-contain"
    priority
  />
</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Magic Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #06B6D4 100%)',
              filter: 'blur(100px)'
            }}
          />

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center mb-12">
              <Badge
                className="mb-6 px-4 py-2 text-base font-medium rounded-full border-0"
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #06B6D4 100%)',
                  color: 'white'
                }}
              >
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Magic
              </Badge>
              <h2
                className="text-4xl md:text-5xl lg:text-[52px] font-bold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Система, которая обучается от ваших клиентов
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-4">
                Вы не придумываете, что добавить в базу. Клиенты делают это за вас — своими вопросами.
              </p>
              <Badge variant="outline" className="px-4 py-2 text-sm border-slate-300 bg-white">
                Magic создаёт черновики. Публикует только админ.
              </Badge>
            </div>

            {/* Magic Flow Visualization */}
            <div className="mb-12 relative">
              <div className="grid md:grid-cols-3 gap-6 items-center">
                {/* Input: Questions */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Вопросы от клиентов</p>
                  {['Через какой банк рассрочка?', 'Есть ли доставка в мой регион?', 'На какой платформе обучение?', 'Сколько стоит?', 'Какие цвета есть?', 'Сколько спикеров?', 'Во сколько начало?', 'Как попасть?'].map((q, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-slate-700 shadow-sm hover:shadow-md transition-all duration-200" style={{ animation: `slideIn 0.3s ease-out ${i * 0.1}s both` }}>
                      {q}
                    </div>
                  ))}
                </div>

                {/* Center: Magic */}
                <div className="flex items-center justify-center">
                  <Card className="border-2 border-[#4F46E5] rounded-2xl bg-white shadow-xl relative">
                    <CardContent className="p-8 text-center">
                      <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#4F46E5] rounded-full animate-ping opacity-75" />
                      <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#7C3AED] rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
                      <Brain className="h-12 w-12 text-[#4F46E5] mx-auto mb-3" />
                      <h3 className="font-bold text-xl text-slate-900 mb-2">Magic</h3>
                      <Badge className="bg-[#4F46E5] text-xs">AI clustering</Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Output: FAQ */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Готовые FAQ</p>
                  {[
                    { q: 'Как протестировать платформу?', a: 'Вы можете попробовать наше демо, которое предоставляет полный доступ на 3 дня.' },
                    { q: 'Сколько стоит ваша система?', a: 'Тарифы начинаются от 2.490 тенге, мы можем подобрать удобный план для вашей команды.' },
                    { q: 'У меня нет времени наполнить систему, что делать?', a: 'Мы оказываем помощь в создании базы знаний, соберем систему практически без вашего участия.' }
                  ].map((item, i) => (
                    <Card key={i} className="border border-emerald-200 bg-emerald-50 shadow-sm hover:shadow-md transition-all duration-200" style={{ animation: `slideIn 0.3s ease-out ${i * 0.15 + 0.5}s both` }}>
                      <CardContent className="p-4">
                        <p className="text-xs font-semibold text-slate-900 mb-2">{item.q}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Screenshots */}
<div className="grid md:grid-cols-2 gap-6">
  {/* BEFORE */}
  <Card className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
    <CardContent className="p-0">
      <div className="relative w-full aspect-[16/9] bg-slate-100">
        <Image
          src="/magic_before_placeholder.png"
          alt="До использования SalesPilot"
          fill
          className="object-contain"
          priority
        />
      </div>
    </CardContent>
  </Card>

  {/* AFTER */}
  <Card className="border-2 border-[#4F46E5] rounded-2xl overflow-hidden bg-white shadow-lg">
    <CardContent className="p-0">
      <div className="relative w-full aspect-[16/9] bg-slate-100">
        <Image
          src="/magic_after_placeholder.png"
          alt="После использования SalesPilot"
          fill
          className="object-contain"
          priority
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-[#4F46E5]">Результат</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

            <style jsx>{`
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @media (prefers-reduced-motion: reduce) {
                * { animation: none !important; }
              }
            `}</style>
          </div>
        </section>

        {/* CTA after Magic */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <Link href="/register">
              <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-lg px-10 py-6">
                Получить демо
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-slate-50 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2
                className="text-4xl md:text-5xl lg:text-[52px] font-bold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Функции, которые ускоряют ответы.<br />
                Не украшают интерфейс.
              </h2>
            </div>

<div className="space-y-8">
  {[
    {
      icon: MessageSquare,
      title: 'Scripts',
      subtitle: 'Сценарии реальных диалогов',
      items: ['Логика «вопрос → ответ → шаг»', 'Готовые формулировки', 'Один стандарт для команды'],
      placeholder: 'scripts_placeholder.png',
    },
    {
      icon: FileText,
      title: 'FAQ',
      subtitle: 'Ответы для возражений',
      items: ['Короткие формулировки', 'Шаблоны с переменными', 'Автопополнение через Magic'],
      placeholder: 'faq_placeholder.png',
    },
    {
      icon: Database,
      title: 'Knowledge Base',
      subtitle: 'Единый источник правды',
      items: ['Условия и цифры', 'Без противоречий', 'Основа для AI-ответов'],
      placeholder: 'kb_placeholder.png',
    },
    {
      icon: BookOpen,
      title: 'Training',
      subtitle: 'Обучение без воды',
      items: ['Короткие модули', 'Примеры диалогов', 'Быстрый онбординг'],
      placeholder: 'training_placeholder.png',
    },
    {
      icon: Search,
      title: 'Global Search',
      subtitle: 'Быстрый поиск без AI',
      items: ['По всей базе', 'Подсветка совпадений', 'Работает всегда'],
      placeholder: 'search_placeholder.png',
    },
    {
      icon: Brain,
      title: 'AI Search',
      subtitle: 'Готовый ответ, а не ссылки',
      items: ['Понимает смысл', 'Собирает из базы', 'Показывает источники'],
      placeholder: 'ai_search_placeholder.png',
    },
  ].map((feature, i) => (
    <Card key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-0">
        <div className={`grid md:grid-cols-2 gap-0 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
          <div className={`p-8 md:p-10 flex flex-col justify-center ${i % 2 === 1 ? 'md:order-2' : ''}`}>
            <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
              <feature.icon className="h-6 w-6 text-[#4F46E5]" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">{feature.title}</h3>
            <p className="text-slate-600 mb-6">{feature.subtitle}</p>
            <ul className="space-y-3">
              {feature.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-slate-700">
                  <Check className="h-5 w-5 text-[#4F46E5] mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 👇 ВОТ ТУТ ЕДИНСТВЕННАЯ ПРАВКА */}
          <div
  className={`bg-slate-100 h-[250px] md:h-auto flex items-center justify-center ${i % 2 === 1 ? 'md:order-1' : ''}`}
>
  <Image
    src={`/${feature.placeholder}`}
    alt={feature.title}
    width={600}
    height={400}
    className="object-contain max-h-full"
    priority={i === 0}
  />
</div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
        {/* CTA after Features */}
        <section className="py-8 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <Link href="/register">
              <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-lg px-10 py-6">
                Получить демо
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Who is it for */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2
                className="text-4xl md:text-5xl lg:text-[52px] font-bold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Для тех, кто строит систему продаж
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  icon: Building2,
                  role: 'CEO / Собственник',
                  situation: 'Когда рост не должен зависеть от одного человека.',
                  benefit: 'SalesPilot масштабирует знания команды.',
                  points: ['Быстрый онбординг', 'Контроль качества', 'Рост без хаоса']
                },
                {
                  icon: Users,
                  role: 'РОП',
                  situation: 'Когда команда спрашивает одно и то же.',
                  benefit: 'SalesPilot отвечает вместо вас.',
                  points: ['Меньше вопросов', 'Единый стандарт', 'Фокус на результат']
                },
                {
                  icon: TrendingUp,
                  role: 'Маркетолог',
                  situation: 'Когда лиды теряются из-за медленных ответов.',
                  benefit: 'SalesPilot ускоряет обработку.',
                  points: ['Выше конверсия', 'Меньше слива', 'Данные для аналитики']
                },
                {
                  icon: Headphones,
                  role: 'Аутсорс-команды',
                  situation: 'Когда знания должны оставаться в системе.',
                  benefit: 'SalesPilot сохраняет экспертизу.',
                  points: ['Независимость', 'Контроль качества', 'Быстрая замена']
                }
              ].map((item, i) => (
                <Card key={i} className="border border-slate-200 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
                      <item.icon className="h-6 w-6 text-[#4F46E5]" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-slate-900">{item.role}</h3>
                    <p className="text-sm text-slate-600 mb-2">{item.situation}</p>
                    <p className="text-sm font-medium text-slate-900 mb-4">{item.benefit}</p>
                    <ul className="space-y-2">
                      {item.points.map((point, j) => (
                        <li key={j} className="text-xs text-slate-600 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#4F46E5]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <p className="text-lg text-slate-900 font-medium leading-relaxed max-w-3xl mx-auto">
                Если продажи держатся на героизме —<br />
                SalesPilot покажет, где вы теряете скорость.
              </p>
            </div>
          </div>
        </section>

        {/* CTA after Who is it for */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <Link href="/register">
              <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-lg px-10 py-6">
                Получить демо
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Before/After Case */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10">
              <h2
                className="text-4xl md:text-5xl lg:text-[52px] font-bold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Один бизнес. Два подхода.
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Отдел из 8 менеджеров. Знания — в чатах, Google Docs и головах.
                После внедрения SalesPilot всё изменилось за 5 дней.
              </p>
            </div>

            {/* Timeline */}
            <Card className="border border-slate-200 rounded-2xl mb-12 bg-white">
              <CardContent className="p-8">
                <h3 className="font-semibold text-lg mb-6 text-slate-900 text-center">Внедрение за 5 дней</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#4F46E5] font-bold">1</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">День 1-2</p>
                    <p className="text-xs text-slate-600">Загрузили FAQ и скрипты</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#4F46E5] font-bold">2</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">День 3</p>
                    <p className="text-xs text-slate-600">Команда начала пользоваться</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#4F46E5] font-bold">3</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">День 5</p>
                    <p className="text-xs text-slate-600">Magic дала 15 новых FAQ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border border-slate-200 rounded-2xl bg-white">
                <CardContent className="p-8">
                  <Badge variant="outline" className="mb-6 border-red-200 text-red-700">До</Badge>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-slate-700">Знания в чатах и файлах</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-slate-700">Каждый отвечает по-своему</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-slate-700">Долгий онбординг</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-[#4F46E5]/20 rounded-2xl bg-[#4F46E5]/5">
                <CardContent className="p-8">
                  <Badge className="mb-6 bg-[#4F46E5] text-white">После</Badge>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#4F46E5] mt-0.5" />
                      <span className="text-slate-700">Единая база ответов</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#4F46E5] mt-0.5" />
                      <span className="text-slate-700">Стандарт для всей команды</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#4F46E5] mt-0.5" />
                      <span className="text-slate-700">Быстрые и уверенные ответы</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border border-slate-200 rounded-2xl bg-white text-center">
                <CardContent className="p-8">
                  <Clock className="h-8 w-8 text-[#4F46E5] mx-auto mb-3" />
                  <div className="text-3xl font-bold text-slate-900 mb-2">−15 мин</div>
                  <p className="text-sm text-slate-600">Скорость ответа</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 rounded-2xl bg-white text-center">
                <CardContent className="p-8">
                  <Target className="h-8 w-8 text-[#4F46E5] mx-auto mb-3" />
                  <div className="text-3xl font-bold text-slate-900 mb-2">до 40%</div>
                  <p className="text-sm text-slate-600">Конверсия</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 rounded-2xl bg-white text-center">
                <CardContent className="p-8">
                  <Users className="h-8 w-8 text-[#4F46E5] mx-auto mb-3" />
                  <div className="text-3xl font-bold text-slate-900 mb-2">до 2 дней</div>
                  <p className="text-sm text-slate-600">Онбординг</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-slate-500 text-center">
              Результаты зависят от ниши и дисциплины команды. Цифры примерные, основаны на отзывах клиентов.
            </p>
          </div>
        </section>

        {/* CTA after Before/After */}
        <section className="py-8 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <Link href="/register">
              <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-lg px-10 py-6">
                Получить демо
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

       {/* Pricing */}
<section id="pricing" className="py-16 md:py-24">
  <div className="container mx-auto px-4 max-w-6xl">
    <div className="text-center mb-12">
      <h2
        className="text-4xl md:text-5xl lg:text-[52px] font-bold mb-6 text-slate-900 leading-tight"
        style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
      >
        Выберите тариф под размер команды
      </h2>
      <p className="text-lg md:text-xl text-slate-600 mb-8">
        Все тарифы включают демо на 3 дня.
      </p>

      {/* KZT по умолчанию, но в центре */}
      <Tabs
        value={currency}
        className="w-fit mx-auto"
        onValueChange={(v) => setCurrency(v as 'KZT' | 'RUB' | 'USD')}
      >
        <TabsList className="bg-slate-100">
          <TabsTrigger value="RUB">₽ RUB</TabsTrigger>
          <TabsTrigger value="KZT">₸ KZT</TabsTrigger>
          <TabsTrigger value="USD">$ USD</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { name: 'Mini', price: pricing[currency].mini, users: '1-3', desc: 'Для малых команд' },
        { name: 'Pro', price: pricing[currency].pro, users: '4-10', desc: 'Для растущих команд', popular: true },
        { name: 'Team', price: pricing[currency].team, users: '11-30', desc: 'Для больших отделов' },
        { name: 'Individual', price: pricing[currency].individual, users: '1', desc: 'Один менеджер' }
      ].map((plan, i) => (
        <Card
          key={i}
          className={`border rounded-2xl relative ${plan.popular ? 'border-[#4F46E5] shadow-lg' : 'border-slate-200'}`}
        >
          {plan.popular && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5]">
              Популярный
            </Badge>
          )}
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-2 text-slate-900">{plan.name}</h3>
            <p className="text-sm text-slate-600 mb-4">{plan.desc}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
              <span className="text-slate-600 ml-2">{currencySymbol[currency]}/мес</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">Пользователей: {plan.users}</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                className={`w-full rounded-xl ${plan.popular ? 'bg-[#4F46E5] hover:bg-[#4338CA]' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                Выбрать тариф
              </Button>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2
              className="text-4xl md:text-5xl lg:text-[52px] font-bold mb-6 text-slate-900 leading-tight"
              style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
            >
              Готовы ускорить ответы менеджеров?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
              Попробуйте SalesPilot в реальной работе.<br />
              Демо на 3 дня. Без карты.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-lg px-10 py-6 w-full sm:w-auto">
                  Запустить демо
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
                <Button size="lg" variant="outline" className="rounded-xl text-lg px-10 py-6 w-full sm:w-auto">
                  Запросить показ (15 минут)
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="text-xl font-bold mb-2" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                SalesPilot
              </div>
              <p className="text-sm text-slate-600 max-w-sm">
                AI-операционная система для отдела продаж
              </p>
            </div>

            <nav className="flex gap-8 text-sm text-slate-600">
              <button onClick={() => scrollToSection('product')} className="hover:text-slate-900 transition-colors">
                Продукт
              </button>
              <button onClick={() => scrollToSection('features')} className="hover:text-slate-900 transition-colors">
                Функции
              </button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-slate-900 transition-colors">
                Тарифы
              </button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
