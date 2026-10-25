import { useEffect, useRef, useState, useCallback } from 'react'

const KEY = (slug) => `hq-progress-${slug}`

export function useReadingProgress(slug, chapter, opts = {}) {
  const {
    debounceMs = 300,
    restoreOffset = 120,
  } = typeof opts === 'object' && opts !== null ? opts : {}

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

  // Muat progres untuk novel dan chapter yang sedang dibuka.
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
    } catch {
      setSaved(null)
      setPercent(0)
    }

    setLoadedKey(chapterKey)
  }, [slug, chapter, chapterKey])

  // Pulihkan posisi setelah isi chapter selesai dimuat.
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

    restoredKeyRef.current = chapterKey

    if (!saved.paragraphId && !saved.percent) return

    const frame = requestAnimationFrame(() => {
      if (saved.paragraphId) {
        const paragraph = document.getElementById(
          saved.paragraphId,
        )

        if (paragraph) {
          const top =
            paragraph.getBoundingClientRect().top +
            window.scrollY -
            restoreOffset

          window.scrollTo({
            top: Math.max(0, top),
            behavior: 'auto',
          })

          return
        }
      }

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight -
          window.innerHeight,
      )

      window.scrollTo({
        top: (Number(saved.percent) / 100) * maxScroll,
        behavior: 'auto',
      })
    })

    return () => cancelAnimationFrame(frame)
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

  // Simpan paragraf aktif dan persentase bacaan.
  const saveProgress = useCallback(() => {
    if (
      !slug ||
      loadedKey !== chapterKey ||
      !contentReady
    ) {
      return
    }

    const paragraphs = document.querySelectorAll(
      '[data-paragraph-id]',
    )

    let paragraphId = null

    for (const paragraph of paragraphs) {
      if (
        paragraph.getBoundingClientRect().top <= restoreOffset
      ) {
        paragraphId = paragraph.id || null
      } else {
        break
      }
    }

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight -
        window.innerHeight,
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

  // Simpan otomatis setelah pembaca berhenti menggulir.
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
        debounceMs,
      )
    }

    const saveImmediately = () => {
      clearTimeout(timerRef.current)
      saveProgress()
    }

    window.addEventListener('scroll', onScroll, {
      passive: true,
    })
    window.addEventListener('pagehide', saveImmediately)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', saveImmediately)
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
    
