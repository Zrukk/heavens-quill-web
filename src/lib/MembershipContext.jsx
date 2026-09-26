import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

const MembershipContext = createContext()

export function MembershipProvider({ children }) {
  const { user } = useAuth()
  const [membership, setMembership] = useState(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  async function checkMembership() {
    if (!user) {
      setMembership(null)
      setIsMember(false)
      setLoading(false)
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
      setLoading(false)
      return
    }

    setMembership(data)

    const isActive = data.status === 'active'
    const notExpired = data.expires_at ? new Date(data.expires_at) > new Date() : false

    setIsMember(isActive && notExpired)
    setLoading(false)
  }

  useEffect(() => {
    checkMembership()
  }, [user])

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
