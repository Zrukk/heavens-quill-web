import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Cache global biar gak fetch berulang
let cachedMembers = null
let cachedAt = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 menit

export function useMembershipList() {
  const [members, setMembers] = useState(cachedMembers || new Set())
  const [loading, setLoading] = useState(!cachedMembers)

  useEffect(() => {
    async function load() {
      const now = Date.now()
      if (cachedMembers && now - cachedAt < CACHE_DURATION) {
        setMembers(cachedMembers)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('memberships')
        .select('user_id, status, expires_at')
        .eq('status', 'active')

      const memberSet = new Set()
      ;(data ?? []).forEach((m) => {
        if (m.expires_at && new Date(m.expires_at) > new Date()) {
          memberSet.add(m.user_id)
        }
      })

      cachedMembers = memberSet
      cachedAt = now
      setMembers(memberSet)
      setLoading(false)
    }
    load()
  }, [])

  return { members, loading, isMember: (userId) => members.has(userId) }
}
