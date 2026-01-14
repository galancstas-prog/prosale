'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface WelcomePopupProps {
  isAdmin: boolean
  userId: string
}

export function WelcomePopup({ isAdmin, userId }: WelcomePopupProps) {
  const [open, setOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!userId) return
    const hasSeenWelcome = localStorage.getItem(`salespilot_welcome_seen_${userId}`)
    if (!hasSeenWelcome) {
      setOpen(true)
    }
  }, [userId])

  const handleClose = () => {
    if (isAdmin && !accepted) return
    localStorage.setItem(`salespilot_welcome_seen_${userId}`, 'true')
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && isAdmin && !accepted) return
        if (!newOpen) handleClose()
      }}
    >
      <DialogContent
        className="sm:max-w-[600px] p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Body with internal scroll */}
        <div className="max-h-[85vh] sm:max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Добро пожаловать в SalesPilot! 🎉</DialogTitle>
              <DialogDescription className="text-sm sm:text-base leading-relaxed pt-2">
                Мы рады приветствовать вас в платформе для эффективной работы отделов продаж.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
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

                {/* bottom spacer so last lines don't hide behind sticky footer */}
                <div className="h-2 sm:h-3" />
              </div>
            </div>
          </div>

          {/* Sticky footer with button (always visible on mobile) */}
          <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-end">
              <Button
                onClick={handleClose}
                disabled={isAdmin && !accepted}
                size="lg"
                className="w-full sm:w-auto"
              >
                Начать работу 🚀
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
