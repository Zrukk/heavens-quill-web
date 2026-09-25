import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

const StreakContext = createContext()

export function StreakProvider({ children }) {
  const { user } = useAuth()
  const [checkedInToday, setCheckedInToday] = useState(true)
  const [loading, setLoading] = useState(true)

  async function checkStreak() {
    if (!user) {
      setCheckedInToday(true)
      setLoading(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const { data } = await supabase
      .from('daily_streaks')
      .select('last_check_in')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data || data.last_check_in !== today) {
      setCheckedInToday(false)
    } else {
      setCheckedInToday(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkStreak()
  }, [user])

  return (
    <StreakContext.Provider value={{ checkedInToday, setCheckedInToday, loading, refreshStreak: checkStreak }}>
      {children}
    </StreakContext.Provider>
  )
}

export function useStreak() {
  const ctx = useContext(StreakContext)
  if (!ctx) throw new Error('useStreak must be used within StreakProvider')
  return ctx
        }
