import { useEffect, useRef, useState, useCallback } from 'react'

const KEY = (slug) => `hq-progress-${slug}`

export function useReadingProgress(slug, chapter, opts = {}) {
  const {
    debounceMs = 300,
    restoreOffset = 120,
  } = typeof opts === 'object' && opts !== null ? opts : {}

  // ChapterReader saat ini mengirim taggedContent sebagai argumen ketiga.
  const contentKey =
    typeof opts === 'string' ? opts : opts?.contentKey

  const contentReady =
    typeof opts === 'string'
      ? opts.length > 0
      : opts?.contentReady !== false

  const [saved, setSaved] = useState(null)
  const [percent, setPercent] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)

  const timerRef = useRef(null)
  const restoredKeyRef = useRef(null)

  const chapterKey = `${slug}:${chapter}`

  // Load progress for the current story and chapter.
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

      if (
        data &&
        Number(data.chapter) === Number(chapter)
      ) {
        const value = Number(data.percent) || 0
        setPercent(Math.min(100, Math.max(0, value)))
      }
    } catch {
      setSaved(null)
      setPercent(0)
    }

    setLoadedKey(chapterKey)
  }, [slug, chapter, chapterKey])

  // Restore the last reading position after chapter content is ready.
  useEffect(() => {
    if (!slug || loadedKey !== chapterKey || !contentReady) {
      return
    }

    if (
      !saved ||
      Number(saved.chapter) !== Number(chapter)
    ) {
      return
    }

    if (restoredKeyRef.current === chapterKey) return

    if (!saved.paragraphId && !saved.percent) {
      restoredKeyRef.current = chapterKey
      return
    }

    restoredKeyRef.current = chapterKey

    const raf = requestAnimationFrame(() => {
      if (saved.paragraphId) {
        const element = document.getElementById(
          saved.paragraphId
        )

        if (element) {
          const top =
            element.getBoundingClientRect().top +
            window.scrollY -
            restoreOffset

          window.scrollTo({
            top: Math.max(0, top),
            behavior: 'auto',
          })

          return
        }
      }

      if (saved.percent) {
        const max = Math.max(
          0,
          document.documentElement.scrollHeight -
            window.innerHeight
        )

        window.scrollTo({
          top: (saved.percent / 100) * max,
          behavior: 'auto',
        })
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [
    slug,
    chapter,
    chapterKey,
    loadedKey,
    saved,
    contentReady,
    contentKey,
    restoreOffset,
  ])

  // Save the current paragraph and scroll percentage.
  const saveProgress = useCallback(() => {
    if (!slug || loadedKey !== chapterKey || !contentReady) {
      return
    }

    const paragraphs = document.querySelectorAll(
      '[data-paragraph-id]'
    )

    let currentId = null

    for (const paragraph of paragraphs) {
      const rect = paragraph.getBoundingClientRect()

      if (rect.top - restoreOffset <= 0) {
        currentId = paragraph.id || null
      } else {
        break
      }
    }

    const max = Math.max(
      0,
      document.documentElement.scrollHeight -
        window.innerHeight
    )

    const nextPercent =
      max > 0
        ? Math.min(
            100,
            Math.max(0, (window.scrollY / max) * 100)
          )
        : 0

    const data = {
      chapter: Number(chapter),
      paragraphId: currentId,
      percent: nextPercent,
      updatedAt: Date.now(),
    }

    setPercent(nextPercent)

    try {
      localStorage.setItem(KEY(slug), JSON.stringify(data))
      setSaved(data)
    } catch (error) {
      console.error('Failed to save reading progress:', error)
    }
  }, [
    slug,
    chapter,
    chapterKey,
    loadedKey,
    contentReady,
    restoreOffset,
  ])

  // Track scrolling and save after a short pause.
  useEffect(() => {
    if (
      !slug ||
      loadedKey !== chapterKey ||
      !contentReady
    ) {
      return
    }

    const onScroll = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(
        saveProgress,
        debounceMs
      )
    }

    window.addEventListener('scroll', onScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
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
      console.error('Failed to clear reading progress:', error)
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
          
