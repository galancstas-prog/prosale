/**
 * Утилиты для работы с HTML текстом
 */

/**
 * Извлекает plain text из HTML строки
 * Используется для предпросмотра контента без HTML тегов
 */
export const stripHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // На сервере используем простое удаление тегов
    return html.replace(/<[^>]*>/g, '').trim()
  }
  
  // В браузере используем DOMParser для точного извлечения текста
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * Обрезает текст до указанной длины с добавлением многоточия
 */
export const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

/**
 * Извлекает preview текст из HTML контента
 * Комбинирует stripHtml и truncateText
 */
export const getTextPreview = (html: string, maxLength: number = 150): string => {
  const plainText = stripHtml(html)
  return truncateText(plainText, maxLength)
}