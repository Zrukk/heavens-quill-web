import { useEffect, useState } from 'react'
import { Flame, Check, Loader, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function DailyStreakCard() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [newTitle, setNewTitle] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadStreak()
  }, [user])

  async function loadStreak() {
    setLoading(true)
    const { data } = await supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak, last_check_in, total_check_ins')
      .eq('user_id', user.id)
      .maybeSingle()
    setStreak(data)
    setLoading(false)
  }

  async function handleCheckIn() {
    if (!user) return
    setChecking(true)
    const { data, error } = await supabase.rpc('check_in_daily_streak', {
      target_user_id: user.id,
    })
    setChecking(false)

    if (!error && data && data[0]) {
      const result = data[0]
      if (result.new_title) setNewTitle(result.new_title)
      setTimeout(() => setNewTitle(null), 5000)
      loadStreak()
    }
  }

  if (!user) return null
  if (loading) return null

  const today = new Date().toISOString().slice(0, 10)
  const checkedInToday = streak?.last_check_in === today

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(212, 175, 91, 0.03))',
        border: '1px solid var(--gold)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a1a',
            flexShrink: 0,
          }}
        >
          <Flame size={24} />
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 2 }}>
            Daily Streak
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>
            {streak?.current_streak || 0} hari
          </div>
          {streak?.longest_streak > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Terlama: {streak.longest_streak} hari · Total: {streak.total_check_ins} check-in
            </div>
          )}
        </div>

        {checkedInToday ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Check size={16} />
            Sudah Check-in
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            className="btn btn--gold"
            disabled={checking}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {checking ? <Loader size={16} className="spin" /> : <Flame size={16} />}
            {checking ? 'Check-in...' : 'Check-in Hari Ini'}
          </button>
        )}
      </div>

      {/* Milestone info */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px dashed rgba(212, 175, 91, 0.3)',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>🌱 1 hari</span>
        <span>·</span>
        <span>🔥 7 hari</span>
        <span>·</span>
        <span>💎 30 hari</span>
        <span>·</span>
        <span>🌌 365 hari</span>
      </div>

      {/* Popup new title */}
      {newTitle && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--gold)',
            color: '#1a1a1a',
            padding: '12px 20px',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: '0.9rem',
            animation: 'slideDown 0.3s',
          }}
        >
          <Sparkles size={18} />
          Gelar baru: {newTitle}!
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
    }
