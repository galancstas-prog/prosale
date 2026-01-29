'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, MoreVertical, Loader2, FileJson, CheckCircle2 } from 'lucide-react'

interface ExportImportMenuProps {
  onExport: () => Promise<any>
  onImport: (jsonData: string) => Promise<any>
  moduleName: string
}

export function ExportImportMenu({ onExport, onImport, moduleName }: ExportImportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await onExport()
      
      // Получаем данные для экспорта (поддержка разных форматов возврата)
      const exportData = result?.data ?? result
      
      if (result?.error) {
        alert(`Ошибка экспорта: ${result.error}`)
        return
      }

      // Создаём и скачиваем файл
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prosale-${moduleName}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Export error:', err)
      alert(err?.message || 'Произошла ошибка при экспорте')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    setImportError('')
    setImportSuccess(null)
    setShowImportDialog(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError('')
    setImportSuccess(null)

    try {
      const text = await file.text()
      const result = await onImport(text)

      if (result?.error) {
        setImportError(result.error)
      } else {
        setImportSuccess(result?.imported ?? result ?? { success: true })
      }
    } catch (err: any) {
      console.error('Import error:', err)
      setImportError(err?.message || 'Произошла ошибка при импорте')
    } finally {
      setIsImporting(false)
      // Сбрасываем input для возможности повторного выбора того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Экспорт в JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Импорт из JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт данных</DialogTitle>
            <DialogDescription>
              Выберите JSON файл для импорта. Данные будут добавлены к существующим.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importError && (
              <Alert variant="destructive">
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {importSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Импорт успешно завершён!
                  <ul className="mt-2 text-sm">
                    {Object.entries(importSuccess).map(([key, value]) => (
                      <li key={key}>• {key}: {String(value)}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 gap-4">
              <FileJson className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Выберите файл .json для импорта
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Импортирую...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Выбрать файл
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
