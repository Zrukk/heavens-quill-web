import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, UserCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [userId])

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 500 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
          marginBottom: 24,
        }}
      >
        <X size={18} />
      </button>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {!loading && !profile && (
        <p style={{ color: 'var(--text-muted)' }}>Pengguna tidak ditemukan.</p>
      )}
      {!loading && profile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--bg)',
              border: '2px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!profile.avatar_url && <UserCircle2 size={52} color="var(--text-muted)" />}
          </div>
          <h1 style={{ fontSize: '1.6rem' }}>{profile.display_name || 'Pembaca'}</h1>
        </div>
      )}
    </div>
  )
}
