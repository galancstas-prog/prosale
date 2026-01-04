'use server'

import { revalidatePath } from 'next/cache'

export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch (e) {
    // Bolt preview / sandbox окружения иногда не имеют static generation store.
    // Нам важно НЕ КРАШИТЬ UI.
    console.warn('[safeRevalidatePath] skipped:', path)
  }
}