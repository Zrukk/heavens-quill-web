import { useEffect } from 'react'
import { useMembership } from '../lib/MembershipContext'

export default function MonetagAds() {
  const { isMember, loading } = useMembership()

  useEffect(() => {
    // Jangan load iklan kalau masih loading atau user udah member
    if (loading || isMember) return

    // Cek apakah script udah pernah di-load (biar gak dobel)
    if (document.getElementById('monetag-vignette')) return

    // === Load Vignette Banner (Zone 11845094) ===
    const vignetteScript = document.createElement('script')
    vignetteScript.id = 'monetag-vignette'
    vignetteScript.src = 'https://n6wxm.com/vignette.min.js'
    vignetteScript.dataset.zone = '11845094'
    vignetteScript.async = true
    document.body.appendChild(vignetteScript)

    // === Load In-Page Push (Zone 11845093) ===
    const pushScript = document.createElement('script')
    pushScript.id = 'monetag-push'
    pushScript.src = 'https://nap5k.com/tag.min.js'
    pushScript.dataset.zone = '11845093'
    pushScript.async = true
    document.body.appendChild(pushScript)

    return () => {
      // Cleanup: hapus script kalau user logout (biar gak dobel)
      const v = document.getElementById('monetag-vignette')
      const p = document.getElementById('monetag-push')
      if (v) v.remove()
      if (p) p.remove()
    }
  }, [isMember, loading])

  return null
        }
