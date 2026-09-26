import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

const MembershipContext = createContext()

export function MembershipProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [membership, setMembership] = useState(null)
  const [isMember, setIsMember] = useState(false)
  const [checkDone, setCheckDone] = useState(false)

  async function checkMembership() {
    // JANGAN cek membership kalau AuthContext masih loading
    // → biar gak salah anggap user=null sebagai "bukan member"
    if (authLoading) return

    if (!user) {
      setMembership(null)
      setIsMember(false)
      setCheckDone(true)
      return
    }

    const { data } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data) {
      setMembership(null)
      setIsMember(false)
      setCheckDone(true)
      return
    }

    setMembership(data)

    const isActive = data.status === 'active'
    const notExpired = data.expires_at ? new Date(data.expires_at) > new Date() : false

    setIsMember(isActive && notExpired)
    setCheckDone(true)
  }

  useEffect(() => {
    checkMembership()
  }, [user, authLoading])

  // Loading = true selama AuthContext masih loading ATAU membership belum dicek
  const loading = authLoading || !checkDone

  return (
    <MembershipContext.Provider value={{ membership, isMember, loading, refreshMembership: checkMembership }}>
      {children}
    </MembershipContext.Provider>
  )
}

export function useMembership() {
  const ctx = useContext(MembershipContext)
  if (!ctx) throw new Error('useMembership must be used within MembershipProvider')
  return ctx
}
