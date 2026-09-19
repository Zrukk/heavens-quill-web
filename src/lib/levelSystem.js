const LEVELS = [
  { level: 1, minChapters: 0, title: '📖 Novice', color: '#8A97A3' },
  { level: 2, minChapters: 10, title: '📚 Reader', color: '#5BA8D4' },
  { level: 3, minChapters: 30, title: '🔥 Bookworm', color: '#D46B7B' },
  { level: 4, minChapters: 80, title: '💎 Story Collector', color: '#A67BD4' },
  { level: 5, minChapters: 150, title: '🌟 Story Expert', color: '#5BBF8A' },
  { level: 6, minChapters: 300, title: '🏆 Master Reader', color: '#D4AF5B' },
  { level: 7, minChapters: 500, title: '👑 Legend', color: '#D4AF5B' },
  { level: 8, minChapters: 800, title: '⚡ Reading Deity', color: '#E3C480' },
  { level: 9, minChapters: 1200, title: '🌌 Eternal Being', color: '#E3C480' },
]

/**
 * Hitung level & title berdasarkan jumlah chapter dibaca
 */
export function getLevelInfo(totalChapters) {
  const count = Number(totalChapters) || 0
  let current = LEVELS[0]
  let next = null

  for (let i = 0; i < LEVELS.length; i++) {
    if (count >= LEVELS[i].minChapters) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    } else {
      break
    }
  }

  // Progress ke level berikutnya
  let progress = 100
  let needed = 0
  if (next) {
    const range = next.minChapters - current.minChapters
    const done = count - current.minChapters
    progress = Math.min(100, Math.round((done / range) * 100))
    needed = next.minChapters - count
  }

  return {
    level: current.level,
    title: current.title,
    color: current.color,
    nextLevel: next?.level || null,
    nextTitle: next?.title || null,
    nextMinChapters: next?.minChapters || null,
    progress,
    needed,
  }
}
