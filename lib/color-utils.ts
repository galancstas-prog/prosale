const COLOR_PALETTE = [
  { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400', emoji: '📘' },
  { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-600 dark:text-green-400', emoji: '🟢' },
  { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-600 dark:text-orange-400', emoji: '🟠' },
  { bg: 'bg-pink-100 dark:bg-pink-950', text: 'text-pink-600 dark:text-pink-400', emoji: '🎀' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950', text: 'text-cyan-600 dark:text-cyan-400', emoji: '🔵' },
  { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', emoji: '🟡' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400', emoji: '💚' },
  { bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-600 dark:text-rose-400', emoji: '🌹' },
  { bg: 'bg-teal-100 dark:bg-teal-950', text: 'text-teal-600 dark:text-teal-400', emoji: '🐟' },
  { bg: 'bg-lime-100 dark:bg-lime-950', text: 'text-lime-600 dark:text-lime-400', emoji: '🍋' },
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getCategoryColor(id: string) {
  const index = hashString(id) % COLOR_PALETTE.length
  return COLOR_PALETTE[index]
}
