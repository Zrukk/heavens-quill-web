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
  console.log('🔍 MembershipContext: Mulai cek user:', user?.id)

  if (!user) {
    console.log('❌ Gak ada user — bukan member')
    setMembership(null)
    setIsMember(false)
    setLoading(false)
    return
  }

  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('📊 Data membership dari Supabase:', data)
  console.log('📊 Error:', error)

  if (!data) {
    console.log('❌ Gak ada row membership')
    setMembership(null)
    setIsMember(false)
    setLoading(false)
    return
  }

  setMembership(data)

  const isActive = data.status === 'active'
  const notExpired = data.expires_at ? new Date(data.expires_at) > new Date() : false

  console.log('🔍 Cek status:', {
    status: data.status,
    isActive,
    expires_at: data.expires_at,
    now: new Date().toISOString(),
    notExpired,
    hasil: isActive && notExpired,
  })

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
