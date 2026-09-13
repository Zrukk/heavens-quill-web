import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function FavoriteButton({ novelId, novelTitle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function check() {
      if (!novelId) return
      setLoading(true)

      // Hitung total favorit novel ini
      const { count: total } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId)
      setCount(total ?? 0)

      // Cek apakah user sudah favoritkan
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('novel_id', novelId)
          .eq('user_id', user.id)
          .maybeSingle()
        setIsFavorited(!!data)
      } else {
        setIsFavorited(false)
      }

      setLoading(false)
    }
    check()
  }, [novelId, user])

  async function toggle() {
    if (!user) {
      navigate('/login')
      return
    }

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('novel_id', novelId)
        .eq('user_id', user.id)
      setIsFavorited(false)
      setCount((c) => Math.max(0, c - 1))
    } else {
      await supabase.from('favorites').insert({
        novel_id: novelId,
        user_id: user.id,
      })
      setIsFavorited(true)
      setCount((c) => c + 1)
    }
  }

  if (loading) return null

  return (
    <button
      onClick={toggle}
      className={isFavorited ? 'btn btn--gold' : 'btn'}
      style={{
        borderColor: 'var(--gold)',
        color: isFavorited ? undefined : 'var(--gold)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
      title={novelTitle ? `Favoritkan ${novelTitle}` : 'Favoritkan'}
    >
      <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
      {isFavorited ? 'Difavoritkan' : 'Favorit'} · {count.toLocaleString('id-ID')}
    </button>
  )
        }
