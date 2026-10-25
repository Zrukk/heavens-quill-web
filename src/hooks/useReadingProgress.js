import { useEffect, useRef, useState, useCallback } from 'react'

const KEY = (slug) => "hq-progress-${slug}"

export function useReadingProgress(slug, chapter, opts = {}) {
const debounceMs = opts?.debounceMs ?? 300
const restoreOffset = opts?.restoreOffset ?? 120

const contentKey =
typeof opts === 'string' ? opts : opts?.contentKey

const contentReady =
typeof opts === 'string'
? opts.length > 0
: opts?.contentReady !== false

const chapterKey = "${slug}:${chapter}"

const [saved, setSaved] = useState(null)
const [percent, setPercent] = useState(0)
const [loadedKey, setLoadedKey] = useState(null)

const timerRef = useRef(null)
const restoredKeyRef = useRef(null)

// Muat progres yang tersimpan untuk novel.
useEffect(() => {
setSaved(null)
setPercent(0)
setLoadedKey(null)
restoredKeyRef.current = null

if (!slug) return

try {
  const raw = localStorage.getItem(KEY(slug))
  const data = raw ? JSON.parse(raw) : null

  setSaved(data)

  if (data && Number(data.chapter) === Number(chapter)) {
    setPercent(
      Math.min(100, Math.max(0, Number(data.percent) || 0)),
    )
  }
} catch (error) {
  console.error('Gagal membaca progres bacaan:', error)
  setSaved(null)
  setPercent(0)
}

setLoadedKey(chapterKey)

}, [slug, chapter, chapterKey])

// Pulihkan posisi setelah konten tersedia dan tata letak terbentuk.
useEffect(() => {
if (
!slug ||
loadedKey !== chapterKey ||
!contentReady ||
!saved ||
Number(saved.chapter) !== Number(chapter) ||
restoredKeyRef.current === chapterKey
) {
return
}

if (
  !saved.paragraphId &&
  !Number.isFinite(Number(saved.scrollY)) &&
  !Number.isFinite(Number(saved.percent))
) {
  return
}

restoredKeyRef.current = chapterKey

// Hindari pemulihan posisi otomatis browser yang menimpa posisi kita.
const previousRestoration = window.history.scrollRestoration
window.history.scrollRestoration = 'manual'

let cancelled = false
let attempts = 0
let frameId

const restore = () => {
  if (cancelled) return

  attempts += 1

  const paragraph = saved.paragraphId
    ? document.getElementById(saved.paragraphId)
    : null

  const documentHeight =
    document.documentElement.scrollHeight

  // Coba pulihkan dengan ID paragraf terlebih dahulu.
  if (paragraph) {
    const top =
      paragraph.getBoundingClientRect().top +
      window.scrollY -
      restoreOffset

    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'auto',
    })
  } else {
    // Gunakan posisi absolut atau persentase sebagai cadangan.
    const maxScroll = Math.max(
      0,
      documentHeight - window.innerHeight,
    )

    let target = Number(saved.scrollY)

    if (!Number.isFinite(target) || target < 0) {
      target = (Number(saved.percent) / 100) * maxScroll
    }

    window.scrollTo({
      top: Math.min(maxScroll, Math.max(0, target)),
      behavior: 'auto',
    })
  }

  // Coba kembali beberapa kali agar pemuatan konten dan gambar
  // tidak menyebabkan posisi bacaan meleset.
  if (attempts < 8) {
    frameId = requestAnimationFrame(restore)
  }
}

frameId = requestAnimationFrame(restore)

return () => {
  cancelled = true
  cancelAnimationFrame(frameId)
  window.history.scrollRestoration = previousRestoration
}

}, [
slug,
chapter,
chapterKey,
loadedKey,
contentReady,
contentKey,
saved,
restoreOffset,
])

// Simpan posisi paragraf, scroll, dan persentase bacaan.
const saveProgress = useCallback(() => {
if (
!slug ||
loadedKey !== chapterKey ||
!contentReady
) {
return
}

const paragraphs = document.querySelectorAll(
  '.chapter-content [data-paragraph-id]',
)

let paragraphId = null

for (const paragraph of paragraphs) {
  if (paragraph.getBoundingClientRect().top <= restoreOffset) {
    paragraphId = paragraph.id || null
  } else {
    break
  }
}

const maxScroll = Math.max(
  0,
  document.documentElement.scrollHeight - window.innerHeight,
)

const nextPercent =
  maxScroll > 0
    ? Math.min(
        100,
        Math.max(0, (window.scrollY / maxScroll) * 100),
      )
    : 0

const data = {
  chapter: Number(chapter),
  paragraphId,
  scrollY: window.scrollY,
  percent: nextPercent,
  updatedAt: Date.now(),
}

try {
  localStorage.setItem(KEY(slug), JSON.stringify(data))
  setSaved(data)
  setPercent(nextPercent)
} catch (error) {
  console.error('Gagal menyimpan progres bacaan:', error)
}

}, [
slug,
chapter,
chapterKey,
loadedKey,
contentReady,
restoreOffset,
])

// Simpan saat menggulir dan ketika halaman akan ditinggalkan.
useEffect(() => {
if (
!slug ||
loadedKey !== chapterKey ||
!contentReady
) {
return
}

const scheduleSave = () => {
  clearTimeout(timerRef.current)
  timerRef.current = setTimeout(saveProgress, debounceMs)
}

const saveImmediately = () => {
  clearTimeout(timerRef.current)
  saveProgress()
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    saveImmediately()
  }
}

window.addEventListener('scroll', scheduleSave, {
  passive: true,
})
window.addEventListener('pagehide', saveImmediately)
window.addEventListener('beforeunload', saveImmediately)
document.addEventListener(
  'visibilitychange',
  onVisibilityChange,
)

return () => {
  window.removeEventListener('scroll', scheduleSave)
  window.removeEventListener('pagehide', saveImmediately)
  window.removeEventListener('beforeunload', saveImmediately)
  document.removeEventListener(
    'visibilitychange',
    onVisibilityChange,
  )
  clearTimeout(timerRef.current)
}

}, [
slug,
chapterKey,
loadedKey,
contentReady,
debounceMs,
saveProgress,
])

const clearProgress = useCallback(() => {
if (!slug) return

try {
  localStorage.removeItem(KEY(slug))
} catch (error) {
  console.error('Gagal menghapus progres bacaan:', error)
}

setSaved(null)
setPercent(0)
restoredKeyRef.current = null

}, [slug])

return {
percent,
savedProgress: saved,
clearProgress,
}
}
