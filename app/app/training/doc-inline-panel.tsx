'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/rich-text-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, Clock, Circle, Loader2, Save, X, ArrowLeft, Pencil } from 'lucide-react'
import { markDocCompleted, markDocInProgress, getMyProgress } from '@/lib/actions/training-progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getTrainingDocById, updateTrainingDoc } from '@/lib/actions/training-docs'
import { getTrainingCategories } from '@/lib/actions/training-categories'
import { getTrainingSubcategories } from '@/lib/actions/training-subcategories'

interface Doc {
  id: string
  title: string
  content_richtext: string | null
  category_id: string
  subcategory_id?: string | null
}

interface Progress {
  id: string
  progress_percent: number
  completed_at: string | null
}

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

interface TrainingDocInlinePanelProps {
  docId: string
  isAdmin: boolean
  searchQuery?: string
  onBack: () => void
  onDocMoved?: () => void
}

export function TrainingDocInlinePanel({ docId, isAdmin, searchQuery, onBack, onDocMoved }: TrainingDocInlinePanelProps) {
  const [doc, setDoc] = useState<Doc | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [shouldHighlight, setShouldHighlight] = useState(!!searchQuery)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const docResult = await getTrainingDocById(docId)
      const progressResult = await getMyProgress(docId)
      const categoriesResult = await getTrainingCategories()

      if (docResult.error || !docResult.data) {
        setError('Документ не найден')
      } else {
        setDoc(docResult.data)
        setContent(docResult.data.content_richtext || '')
        setTitle(docResult.data.title || '')
        setCategoryId(docResult.data.category_id || '')
        setSubcategoryId(docResult.data.subcategory_id || '')
        setProgress(progressResult.data)
        setCategories(categoriesResult.data || [])
        
        // Загружаем подкатегории для текущей категории
        if (docResult.data.category_id) {
          const subcatResult = await getTrainingSubcategories(docResult.data.category_id)
          setSubcategories(subcatResult.data || [])
        }
      }
      setLoading(false)
    }
    loadData()
  }, [docId])

  // Загружаем подкатегории при смене категории
  useEffect(() => {
    async function loadSubcategories() {
      if (categoryId && editing) {
        const subcatResult = await getTrainingSubcategories(categoryId)
        setSubcategories(subcatResult.data || [])
        // Сбрасываем подкатегорию если она не принадлежит новой категории
        if (subcategoryId && !subcatResult.data?.find((s: Subcategory) => s.id === subcategoryId)) {
          setSubcategoryId('')
        }
      }
    }
    loadSubcategories()
  }, [categoryId, editing])

  useEffect(() => {
    if (doc && !progress && !isAdmin) {
      markDocInProgress(doc.id)
    }
  }, [doc, progress, isAdmin])

  useEffect(() => {
    if (searchQuery && contentRef.current && !editing) {
      setTimeout(() => {
        const marks = contentRef.current?.querySelectorAll('mark')
        if (marks && marks.length > 0) {
          marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)

      setTimeout(() => {
        setShouldHighlight(false)
      }, 3000)
    }
  }, [searchQuery, editing])

  const getStatus = () => {
    if (!progress) return 'not_started'
    if (progress.completed_at && progress.progress_percent === 100) return 'completed'
    if (progress.progress_percent > 0) return 'in_progress'
    return 'not_started'
  }

  const status = getStatus()

  const handleMarkCompleted = async () => {
    if (!doc) return
    setError('')
    setLoadingProgress(true)

    try {
      await markDocCompleted(doc.id)
      setProgress({ ...progress!, progress_percent: 100, completed_at: new Date().toISOString() })
    } catch (err: any) {
      setError(err?.message || 'Ошибка при отметке')
    } finally {
      setLoadingProgress(false)
    }
  }

  const handleSave = async () => {
    if (!doc) return
    setError('')
    setSaving(true)

    try {
      const categoryChanged = categoryId !== doc.category_id
      const subcategoryChanged = subcategoryId !== (doc.subcategory_id || '')
      
      const result = await updateTrainingDoc(doc.id, { 
        title: title.trim(), 
        content_richtext: content,
        category_id: categoryId,
        subcategory_id: subcategoryId || null
      })
      if (result.error) throw new Error(result.error)
      setDoc({ ...doc, title: title.trim(), content_richtext: content, category_id: categoryId, subcategory_id: subcategoryId || null })
      setEditing(false)
      
      // Если категория или подкатегория изменились, уведомляем родителя
      if ((categoryChanged || subcategoryChanged) && onDocMoved) {
        onDocMoved()
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const highlightContent = (html: string, query: string): string => {
    if (!query || !html || !shouldHighlight) return html
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return html.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !doc) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к списку
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!doc) return null

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад к списку
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold"
                  placeholder="Название документа"
                />
              ) : (
                <CardTitle className="text-xl">{doc.title}</CardTitle>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Кнопка редактирования наверху */}
              {isAdmin && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              )}
              {status === 'completed' && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Завершено
                </Badge>
              )}
              {status === 'in_progress' && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  В процессе
                </Badge>
              )}
              {status === 'not_started' && (
                <Badge variant="outline">
                  <Circle className="h-3 w-3 mr-1" />
                  Не начато
                </Badge>
              )}
            </div>
          </div>
          
          {/* Селекторы категории/подкатегории при редактировании */}
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Подкатегория</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Без подкатегории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без подкатегории</SelectItem>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {editing ? (
            <div className="space-y-4">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Содержание документа..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    setContent(doc.content_richtext || '')
                    setTitle(doc.title)
                  }}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          ) : (
            <div
              ref={contentRef}
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: highlightContent(doc.content_richtext || '<p>Нет содержимого</p>', searchQuery || ''),
              }}
            />
          )}

          {/* Кнопка завершения обучения для не-админов */}
          {!isAdmin && status !== 'completed' && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button onClick={handleMarkCompleted} disabled={loadingProgress}>
                {loadingProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Отметить как завершённое
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
