import { useEffect, useRef, useState, useCallback } from 'react'

const KEY = (slug) => `hq-progress-${slug}`

export function useReadingProgress(slug, chapter, opts = {}) {
  const { debounceMs = 300, restoreOffset = 120 } = opts
  const [saved, setSaved] = useState(null)
  const timerRef = useRef(null)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (!slug) return
    try {
      const raw = localStorage.getItem(KEY(slug))
      setSaved(raw ? JSON.parse(raw) : null)
    } catch {
      setSaved(null)
    }
  }, [slug])

  useEffect(() => {
    if (!saved || restoredRef.current) return
    if (saved.chapter !== chapter) return
    if (!saved.paragraphId && !saved.percent) return

    restoredRef.current = true

    const raf = requestAnimationFrame(() => {
      if (saved.paragraphId) {
        const el = document.getElementById(saved.paragraphId)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - restoreOffset
          window.scrollTo({ top, behavior: 'auto' })
          return
        }
      }
      if (saved.percent) {
        const max = document.body.scrollHeight - window.innerHeight
        window.scrollTo({ top: (saved.percent / 100) * max, behavior: 'auto' })
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [saved, chapter, restoreOffset])

  const saveProgress = useCallback(() => {
    const paragraphs = document.querySelectorAll('[data-paragraph-id]')
    let currentId = null
    for (const p of paragraphs) {
      const rect = p.getBoundingClientRect()
      if (rect.top - restoreOffset <= 0) currentId = p.dataset.paragraphId
      else break
    }
    const max = document.body.scrollHeight - window.innerHeight
    const percent = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0

    const data = {
      chapter,
      paragraphId: currentId,
      percent,
      updatedAt: Date.now(),
    }
    try {
      localStorage.setItem(KEY(slug), JSON.stringify(data))
    } catch {}
  }, [slug, chapter, restoreOffset])

  useEffect(() => {
    if (!slug) return
    const onScroll = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(saveProgress, debounceMs)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    saveProgress()

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timerRef.current)
      saveProgress()
    }
  }, [slug, chapter, debounceMs, saveProgress])

  const clearProgress = useCallback(() => {
    localStorage.removeItem(KEY(slug))
    setSaved(null)
  }, [slug])

  return { savedProgress: saved, clearProgress }
}
