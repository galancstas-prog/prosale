'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestConnectionPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTests = async () => {
    setTesting(true)
    const testResults: any = {
      envVars: {},
      database: {},
      registration: {}
    }

    try {
      const response = await fetch('/api/test-connection')
      const data = await response.json()
      testResults.envVars = data.envVars || {}
      testResults.database = data.database || {}

      if (!data.envVars.serviceRoleKey) {
        testResults.registration.status = 'skipped'
        testResults.registration.message = 'Service role key не установлен'
      }
    } catch (error) {
      testResults.error = String(error)
    }

    setResults(testResults)
    setTesting(false)
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />
    return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Проверка подключения Supabase</h1>
          <p className="text-gray-600 mt-2">
            Диагностика подключения к базе данных и настройки регистрации
          </p>
        </div>

        <Button onClick={runTests} disabled={testing} size="lg">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Проверка...
            </>
          ) : (
            'Запустить проверку'
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon status={results.envVars.status} />
                  Переменные окружения
                </CardTitle>
                <CardDescription>
                  Проверка наличия необходимых ключей Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                    {results.envVars.url ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                    {results.envVars.anonKey ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</span>
                    {results.envVars.serviceRoleKey ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                {!results.envVars.serviceRoleKey && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      <strong>ВАЖНО:</strong> Service Role Key не установлен!
                      <br />
                      Откройте файл <code className="bg-gray-200 px-1">КАК_ПОЛУЧИТЬ_SERVICE_ROLE_KEY.txt</code> для инструкций.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Database Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon status={results.database.status} />
                  Подключение к базе данных
                </CardTitle>
                <CardDescription>
                  Проверка доступа к таблицам Supabase
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.database.status === 'ok' ? (
                  <div className="space-y-2">
                    <p className="text-green-600">✓ Подключение успешно</p>
                    {results.database.tables && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Найденные таблицы:</p>
                        <div className="flex flex-wrap gap-1">
                          {results.database.tables.map((table: string) => (
                            <span key={table} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {table}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      {results.database.error || 'Не удалось подключиться к базе данных'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {results.envVars.serviceRoleKey && results.database.status === 'ok' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Всё готово!</strong> Регистрация должна работать.
                  <br />
                  Перейдите на <a href="/register" className="underline">/register</a> для создания аккаунта.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Быстрая помощь</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Получить Service Role Key</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-4">
                <li>Откройте <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a></li>
                <li>Settings (⚙️) → API</li>
                <li>Скопируйте service_role ключ</li>
                <li>Вставьте в файл .env</li>
                <li>Перезапустите сервер (Ctrl+C, затем npm run dev)</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Структура .env файла</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... <-- ВАЖНО!`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Документация</h3>
              <ul className="space-y-1 text-sm">
                <li>📄 <code>КАК_ПОЛУЧИТЬ_SERVICE_ROLE_KEY.txt</code> - Пошаговая инструкция на русском</li>
                <li>📄 <code>SETUP_INSTRUCTIONS.md</code> - Полная настройка</li>
                <li>📄 <code>TEST_CHECKLIST.md</code> - Тестирование приложения</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
