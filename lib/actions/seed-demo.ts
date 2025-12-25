'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { revalidatePath } from 'next/cache'

export async function createDemoContent() {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('type', 'script')
    .eq('tenant_id', user.appUser.tenant_id)
    .limit(1)

  if (existingCategories && existingCategories.length > 0) {
    return { error: 'Demo content already exists. Delete existing categories first.' }
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .insert({
      tenant_id: user.appUser.tenant_id,
      name: 'Sales Scripts',
      description: 'Cold calling and sales conversation scripts',
      type: 'script',
    })
    .select()
    .single()

  if (categoryError || !category) {
    return { error: 'Failed to create demo category' }
  }

  const { data: thread, error: threadError } = await supabase
    .from('script_threads')
    .insert({
      tenant_id: user.appUser.tenant_id,
      category_id: category.id,
      title: 'Cold Call - Product Introduction',
      description: 'A sample script for introducing our product to potential clients',
      is_published: true,
      created_by: user.appUser.id,
    })
    .select()
    .single()

  if (threadError || !thread) {
    return { error: 'Failed to create demo thread' }
  }

  const turns = [
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 1,
      speaker: 'agent',
      content: 'Good morning! This is Alex from TechSolutions. Am I speaking with the person responsible for IT infrastructure decisions?',
    },
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 2,
      speaker: 'client',
      content: 'Yes, that\'s me. What is this about?',
    },
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 3,
      speaker: 'agent',
      content: 'Thank you for taking my call. I\'ll be brief. We\'ve recently helped companies similar to yours reduce their infrastructure costs by up to 40% while improving performance. Would you have 2 minutes to hear how we did it?',
    },
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 4,
      speaker: 'client',
      content: 'Sure, go ahead.',
    },
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 5,
      speaker: 'agent',
      content: 'Perfect! Our platform automates server management and optimizes resource allocation in real-time. For instance, one of our clients in the fintech sector was spending $50,000 monthly on cloud infrastructure. After implementing our solution, they reduced that to $30,000 while actually improving their system response times by 35%.',
    },
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 6,
      speaker: 'client',
      content: 'That sounds interesting. How does it work?',
    },
    {
      tenant_id: user.appUser.tenant_id,
      thread_id: thread.id,
      turn_order: 7,
      speaker: 'agent',
      content: 'Great question! Our AI-driven system analyzes your infrastructure usage patterns and automatically scales resources based on actual demand rather than peak estimates. This means you only pay for what you actually use. Would it make sense to schedule a 30-minute demo where I can show you exactly how this would work for your specific setup?',
    },
  ]

  const { error: turnsError } = await supabase.from('script_turns').insert(turns)

  if (turnsError) {
    return { error: 'Failed to create demo conversation turns' }
  }

  revalidatePath('/app')
  revalidatePath('/app/scripts')

  return { success: true, categoryId: category.id }
}
