'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface WelcomePopupProps {
  isAdmin: boolean
  userEmail: string
}

export function WelcomePopup({ isAdmin, userEmail }: WelcomePopupProps) {
  const [open, setOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`welcome_seen_${userEmail}`)
    if (!hasSeenWelcome) {
      setOpen(true)
    }
  }, [userEmail])

  const handleClose = () => {
    if (isAdmin && !accepted) return
    localStorage.setItem(`welcome_seen_${userEmail}`, 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && isAdmin && !accepted) return
      if (!newOpen) handleClose()
    }}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Добро пожаловать в SalesPilot! 🎉</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-2">
            Мы рады приветствовать вас в платформе для эффективной работы отделов продаж.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">
              <strong>SalesPilot</strong> — это ваш помощник в работе со скриптами продаж, обучением команды, базой знаний и AI-поиском. 🚀
            </p>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                ✨ Демо-доступ активирован
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Сейчас у вас активирован <strong>тариф PRO</strong> на <strong>3 дня</strong>. Вы можете протестировать все возможности платформы, включая AI-поиск и работу с командой.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">📚 Быстрый старт:</p>
              <ul className="text-sm space-y-1 pl-4">
                <li>• <strong>Скрипты</strong> — создавайте и управляйте сценариями продаж</li>
                <li>• <strong>Обучение</strong> — обучайте команду с помощью структурированных материалов</li>
                <li>• <strong>FAQ</strong> — быстрые ответы на частые вопросы</li>
                <li>• <strong>База знаний</strong> — храните всю информацию о продуктах и процессах</li>
                <li>• <strong>AI-поиск</strong> — задавайте вопросы и получайте мгновенные ответы</li>
              </ul>
            </div>

            {isAdmin && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                      Я принимаю условия использования сервиса
                    </Label>
                    <div className="text-xs text-muted-foreground space-x-2">
                      <a href="#" className="underline hover:text-foreground">Публичная оферта</a>
                      <span>•</span>
                      <a href="#" className="underline hover:text-foreground">Политика конфиденциальности</a>
                      <span>•</span>
                      <a href="#" className="underline hover:text-foreground">Правила использования</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleClose}
            disabled={isAdmin && !accepted}
            size="lg"
          >
            Начать работу 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
