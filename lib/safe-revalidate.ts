'use server'

import { revalidatePath } from 'next/cache'

export async function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // в bolt/превью/дев-режиме иногда нет нужного контекста — просто игнорим
  }
}