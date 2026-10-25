import { useEffect, useRef, useState, useCallback } from 'react'

const KEY = (slug) => `hq-progress-${slug}`

export function useReadingProgress(slug, chapter, opts = {}) {
  const debounceMs = opts?.debounceMs ?? 300
  const restoreOffset = opts?.restoreOffset ?? 120

  const contentKey =
    typeof opts === 'string' ? opts : opts?.contentKey

  const contentReady =
    typeof opts === 'string'
      ? opts.length > 0
      : opts?.contentReady !== false

  const chapterKey = `${slug}:${chapter}`

  const [saved, setSaved] = useState(null)
  const [percent, setPercent] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)

  const timerRef = useRef(null)
  const restoredKeyRef = useRef(null)
  const isRestoringRef = useRef(false)

  // Muat progres yang tersimpan.
  useEffect(() => {
    setSaved(null)
    setPercent(0)
    setLoadedKey(null)
    restoredKeyRef.current = null
    isRestoringRef.current = false

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

  // Pulihkan posisi bacaan dan pantau perubahan tinggi konten.
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

    const savedScrollY = Number(saved.scrollY)
    const savedPercent = Number(saved.percent)

    const hasScrollY =
      Number.isFinite(savedScrollY) && savedScrollY >= 0

    const hasPercent =
      Number.isFinite(savedPercent) &&
      savedPercent >= 0 &&
      savedPercent <= 100

    if (!saved.paragraphId && !hasScrollY && !hasPercent) {
      return
    }

    restoredKeyRef.current = chapterKey
    isRestoringRef.current = true

    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    let cancelled = false
    let frameId = null
    let releaseTimer = null
    let lastHeight = 0
    let stableFrames = 0
    let attempts = 0

    const restore = () => {
      if (cancelled) return

      attempts += 1

      const root = document.documentElement
      const height = root.scrollHeight
      const maxScroll = Math.max(0, height - window.innerHeight)

      const paragraph = saved.paragraphId
        ? document.getElementById(saved.paragraphId)
        : null

      let target = 0

      if (paragraph) {
        target =
          paragraph.getBoundingClientRect().top +
          window.scrollY -
          restoreOffset
      } else if (hasScrollY) {
        target = savedScrollY
      } else if (hasPercent) {
        target = (savedPercent / 100) * maxScroll
      }

      window.scrollTo({
        top: Math.max(0, Math.min(target, maxScroll)),
        behavior: 'auto',
      })

      if (height === lastHeight) {
        stableFrames += 1
      } else {
        lastHeight = height
        stableFrames = 0
      }

      if (attempts < 120 && stableFrames < 12) {
        frameId = requestAnimationFrame(restore)
      } else {
        releaseTimer = window.setTimeout(() => {
          if (!cancelled) {
            isRestoringRef.current = false
          }
        }, 500)
      }
    }

    // Tunggu elemen chapter muncul jika konten belum siap dirender.
    const waitForContent = () => {
      if (cancelled) return

      const paragraph = saved.paragraphId
        ? document.getElementById(saved.paragraphId)
        : null

      const content = document.querySelector('.chapter-content')

      if (content || paragraph || attempts > 120) {
        frameId = requestAnimationFrame(restore)
      } else {
        frameId = requestAnimationFrame(waitForContent)
      }
    }

    frameId = requestAnimationFrame(waitForContent)

    return () => {
      cancelled = true

      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }

      if (releaseTimer !== null) {
        clearTimeout(releaseTimer)
      }

      isRestoringRef.current = false
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

  // Simpan posisi paragraf, scroll, dan persentase.
  const saveProgress = useCallback(() => {
    if (
      isRestoringRef.current ||
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
        ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100))
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

  // Simpan saat menggulir atau meninggalkan halaman.
  useEffect(() => {
    if (!slug || loadedKey !== chapterKey || !contentReady) {
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

    window.addEventListener('scroll', scheduleSave, { passive: true })
    window.addEventListener('pagehide', saveImmediately)
    window.addEventListener('beforeunload', saveImmediately)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('scroll', scheduleSave)
      window.removeEventListener('pagehide', saveImmediately)
      window.removeEventListener('beforeunload', saveImmediately)
      document.removeEventListener('visibilitychange', onVisibilityChange)
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
    isRestoringRef.current = false
  }, [slug])

  return {
    percent,
    savedProgress: saved,
    clearProgress,
  }
        }
