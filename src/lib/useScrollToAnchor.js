import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollToAnchor() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return

    // Delay biar konten selesai render dulu
    const timer = setTimeout(() => {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Highlight sebentar
        el.style.transition = 'background-color 0.3s'
        el.style.backgroundColor = 'rgba(212, 175, 91, 0.2)'
        setTimeout(() => {
          el.style.backgroundColor = ''
        }, 2000)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [location.hash, location.pathname])
                   }
