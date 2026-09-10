import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PublicProfile() {
  const { userId } = useParams()
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

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!profile) return <div className="container" style={{ paddingTop: 40 }}>Pengguna tidak ditemukan.</div>

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 500 }}>
      <Link
        to="/"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}
      >
        <ArrowLeft size={15} />
        Kembali
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--surface)',
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
    </div>
  )
  }
