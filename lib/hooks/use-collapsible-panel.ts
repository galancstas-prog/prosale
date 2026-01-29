'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'prosale-panel-collapsed'

interface PanelState {
  [key: string]: boolean
}

export function useCollapsiblePanel(panelId: string) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Загружаем состояние из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: PanelState = JSON.parse(stored)
        setIsCollapsed(state[panelId] ?? false)
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    setIsLoaded(true)
  }, [panelId])

  // Сохраняем состояние в localStorage
  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const newValue = !prev
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const state: PanelState = stored ? JSON.parse(stored) : {}
        state[panelId] = newValue
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Игнорируем ошибки
      }
      return newValue
    })
  }

  return {
    isCollapsed,
    toggleCollapsed,
    isLoaded, // Для избежания гидратации
  }
}
