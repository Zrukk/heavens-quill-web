import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile(u) {
      if (!u) {
        setIsAdmin(false)
        setDebugInfo(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', u.id)
        .maybeSingle()
      setIsAdmin(data?.is_admin ?? false)
      setDebugInfo({ userId: u.id, data, error: error?.message ?? null })
    }

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

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut, debugInfo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
        }
