'use server'

import { revalidatePath } from 'next/cache'

export async function createDemoContent() {
  revalidatePath('/app')
  revalidatePath('/app/scripts')
  return { success: true }
}
