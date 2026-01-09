'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { logQuestion } from '@/lib/actions/question-logs'

export function QuestionCaptureBar() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim() || query.trim().length < 3) {
      setErrorMessage('Вопрос слишком короткий')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
      return
    }

    setLoading(true)
    setStatus('idle')
    setErrorMessage('')

    const result = await logQuestion({
      query: query.trim(),
      source: 'manual',
      found: false
    })

    setLoading(false)

    if (result.success) {
      setStatus('success')
      setQuery('')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('error')
      setErrorMessage(result.error || 'Не удалось записать вопрос')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите вопрос, который сегодня вам задал клиент"
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Записываем...' : 'Записать'}
        </Button>
      </form>

      {status === 'success' && (
        <p className="text-sm text-green-600 mt-2">Записано</p>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
      )}
    </div>
  )
}
