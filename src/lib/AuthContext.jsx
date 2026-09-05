import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [displayName, setDisplayName] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u) {
    if (!u) {
      setIsAdmin(false)
      setDisplayName(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, display_name')
      .eq('id', u.id)
      .maybeSingle()
    setIsAdmin(data?.is_admin ?? false)
    setDisplayName(data?.display_name ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()
  const refreshProfile = () => loadProfile(user)

  return (
    <AuthContext.Provider value={{ user, isAdmin, displayName, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
