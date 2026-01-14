'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Check, Sparkles, Search, Database, MessageSquare, BookOpen, FileText, Brain, Zap } from 'lucide-react'
import { WHATSAPP_URL } from '@/lib/constants'
import { useState } from 'react'

export default function Landing() {
  const [currency, setCurrency] = useState<'KZT' | 'RUB' | 'BYN'>('RUB')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const pricing = {
    KZT: { mini: '19 900', pro: '49 900', team: '99 900', individual: '9 900' },
    RUB: { mini: '2 990', pro: '7 990', team: '14 990', individual: '1 490' },
    BYN: { mini: '99', pro: '249', team: '499', individual: '49' }
  }

  const currencySymbol = { KZT: '₸', RUB: '₽', BYN: 'Br' }

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
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h1
                  className="text-5xl md:text-6xl lg:text-[64px] font-bold leading-[1.05] text-slate-900"
                  style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                >
                  SalesPilot<br />
                  <span className="text-slate-700">Единый источник ответов для отдела продаж</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
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
                    <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-base px-8 w-full sm:w-auto">
                      Запустить демо на 3 дня
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl text-base px-8 w-full sm:w-auto"
                    onClick={() => scrollToSection('features')}
                  >
                    Посмотреть функции
                  </Button>
                </div>

                <p className="text-sm text-slate-500">
                  Без карты • Полный доступ • PRO-тариф
                </p>
              </div>

              <div className="relative h-[400px] lg:h-[500px] hidden lg:flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-[40px] opacity-[0.15]"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #06B6D4 100%)',
                    filter: 'blur(60px)',
                    animation: 'float 10s ease-in-out infinite'
                  }}
                />
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

        {/* What is it + How it works */}
        <section id="product" className="py-20 md:py-32 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Это не CRM.<br />
                Это Sales OS: знания → ответы → сделки.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Вы собираете знания один раз.
                SalesPilot даёт менеджеру готовую формулировку
                в момент, когда клиент ещё на связи.
              </p>
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
                <div className="bg-slate-100 h-[400px] flex items-center justify-center text-slate-400">
                  [dashboard_placeholder.png]
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Magic Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
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
                className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Система, которая обучается от ваших клиентов
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
                Менеджеры фиксируют реальные вопросы.
                SalesPilot находит повторяющиеся темы
                и создаёт черновики FAQ.
              </p>
              <Badge variant="outline" className="px-4 py-2 text-sm border-slate-300">
                Magic создаёт черновики. Публикует только админ.
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border border-slate-200 rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-[#4F46E5] font-bold text-lg mb-3">Шаг 1</div>
                  <h3 className="font-semibold mb-2 text-slate-900">Менеджеры фиксируют</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Реальные вопросы клиентов попадают в систему
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-[#4F46E5] font-bold text-lg mb-3">Шаг 2</div>
                  <h3 className="font-semibold mb-2 text-slate-900">Админ запускает Magic</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Одна кнопка для анализа всех вопросов
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-[#4F46E5] font-bold text-lg mb-3">Шаг 3</div>
                  <h3 className="font-semibold mb-2 text-slate-900">Система создаёт FAQ</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Группирует вопросы и предлагает черновики
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border border-slate-200 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-slate-100 h-[250px] flex items-center justify-center text-slate-400">
                    [magic_before_placeholder.png]
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-slate-100 h-[250px] flex items-center justify-center text-slate-400">
                    [magic_after_placeholder.png]
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Функции, которые ускоряют ответы.<br />
                Не украшают интерфейс.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: MessageSquare,
                  title: 'Scripts',
                  desc: 'Сценарии реальных диалогов',
                  items: ['Логика «вопрос → ответ → шаг»', 'Готовые формулировки', 'Один стандарт для команды']
                },
                {
                  icon: FileText,
                  title: 'FAQ',
                  desc: 'Ответы для возражений',
                  items: ['Короткие формулировки', 'Шаблоны с переменными', 'Автопополнение через Magic']
                },
                {
                  icon: Database,
                  title: 'Knowledge Base',
                  desc: 'Единый источник правды',
                  items: ['Условия и цифры', 'Без противоречий', 'Основа для AI-ответов']
                },
                {
                  icon: BookOpen,
                  title: 'Training',
                  desc: 'Обучение без воды',
                  items: ['Короткие модули', 'Примеры диалогов', 'Быстрый онбординг']
                },
                {
                  icon: Search,
                  title: 'Global Search',
                  desc: 'Быстрый поиск без AI',
                  items: ['По всей базе', 'Подсветка совпадений', 'Работает всегда']
                },
                {
                  icon: Brain,
                  title: 'AI Search',
                  desc: 'Готовый ответ, а не ссылки',
                  items: ['Понимает смысл', 'Собирает из базы', 'Показывает источники']
                }
              ].map((feature, i) => (
                <Card key={i} className="border border-slate-200 rounded-2xl hover:shadow-md transition-all duration-200">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-6">
                      <feature.icon className="h-6 w-6 text-[#4F46E5]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 mb-4">{feature.desc}</p>
                    <ul className="space-y-2">
                      {feature.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-[#4F46E5] mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Who is it for */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Для тех, кто строит систему продаж
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { role: 'CEO / Собственник', desc: 'Когда рост не должен зависеть от одного человека.' },
                { role: 'РОП', desc: 'Когда команда должна отвечать одинаково сильно.' },
                { role: 'Маркетолог', desc: 'Когда лиды нельзя терять из-за медленных ответов.' },
                { role: 'Аутсорс-команды', desc: 'Когда знания должны оставаться в системе.' }
              ].map((item, i) => (
                <Card key={i} className="border border-slate-200 rounded-2xl">
                  <CardContent className="p-8">
                    <h3 className="font-semibold text-lg mb-3 text-slate-900">{item.role}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <p className="text-lg text-slate-700 leading-relaxed max-w-3xl mx-auto">
                Если продажи держатся на героизме —<br />
                SalesPilot покажет, где вы теряете скорость.
              </p>
            </div>
          </div>
        </section>

        {/* Before/After Case */}
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Один бизнес. Два подхода.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border border-slate-200 rounded-2xl">
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

            <Card className="border border-slate-200 rounded-2xl">
              <CardContent className="p-8">
                <h3 className="font-semibold text-lg mb-4 text-slate-900">Типичные результаты:</h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check className="h-5 w-5 text-[#4F46E5]" />
                    <span>Онбординг быстрее</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check className="h-5 w-5 text-[#4F46E5]" />
                    <span>Меньше вопросов к РОПу</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check className="h-5 w-5 text-[#4F46E5]" />
                    <span>Конверсия стабильнее</span>
                  </li>
                </ul>
                <p className="text-sm text-slate-500">
                  Результаты зависят от ниши и дисциплины команды.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 md:py-32">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
                style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
              >
                Выберите тариф под размер команды
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Все тарифы включают демо на 3 дня.
              </p>

              <Tabs defaultValue="RUB" className="w-fit mx-auto" onValueChange={(v) => setCurrency(v as any)}>
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="KZT">₸ KZT</TabsTrigger>
                  <TabsTrigger value="RUB">₽ RUB</TabsTrigger>
                  <TabsTrigger value="BYN">Br BYN</TabsTrigger>
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
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2
              className="text-4xl md:text-[44px] font-semibold mb-6 text-slate-900 leading-tight"
              style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
            >
              Готовы ускорить ответы менеджеров?
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Попробуйте SalesPilot в реальной работе.<br />
              Демо на 3 дня. Без карты.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] transition-all duration-200 rounded-xl text-base px-8 w-full sm:w-auto">
                  Запустить демо
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="rounded-xl text-base px-8 w-full sm:w-auto">
                  Запросить показ (15 минут)
                </Button>
              </Link>
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
