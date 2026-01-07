'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AccessExpiredModalProps {
  open: boolean
}

export function AccessExpiredModal({ open }: AccessExpiredModalProps) {
  const handleUpgrade = () => {
    window.open('https://wa.me/77086807424', '_blank')
  }

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl">Доступ истёк</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Продлите тариф, чтобы продолжить работу.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button onClick={handleUpgrade} className="w-full sm:w-auto">
            Продлить доступ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
