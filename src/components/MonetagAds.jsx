import { useEffect } from 'react'
import { useMembership } from '../lib/MembershipContext'

export default function MonetagAds() {
  const { isMember, loading } = useMembership()

  useEffect(() => {
    // TUNGGU sampai AuthContext + MembershipContext selesai cek
    // → biar gak salah load iklan buat member
    if (loading) return

    // Kalau user member aktif → JANGAN load iklan
    if (isMember) {
      console.log('🔍 MonetagAds: User adalah member — iklan TIDAK di-load')
      return
    }

    // Cek apakah script udah pernah di-load (biar gak dobel)
    if (document.getElementById('monetag-vignette')) return

    console.log('🔍 MonetagAds: Load iklan (user bukan member)')

    const vignetteScript = document.createElement('script')
    vignetteScript.id = 'monetag-vignette'
    vignetteScript.src = 'https://n6wxm.com/vignette.min.js'
    vignetteScript.dataset.zone = '11845094'
    vignetteScript.async = true
    document.body.appendChild(vignetteScript)

    const pushScript = document.createElement('script')
    pushScript.id = 'monetag-push'
    pushScript.src = 'https://nap5k.com/tag.min.js'
    pushScript.dataset.zone = '11845093'
    pushScript.async = true
    document.body.appendChild(pushScript)
  }, [isMember, loading])

  return null
}
