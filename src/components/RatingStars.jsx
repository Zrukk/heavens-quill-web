import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function RatingStars({ novelId, size = 20, showAverage = true }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [userRating, setUserRating] = useState(0)
  const [average, setAverage] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!novelId) return
      setLoading(true)

      // Hitung rata-rata + total
      const { data: allRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('novel_id', novelId)

      if (allRatings && allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
        setAverage(sum / allRatings.length)
        setTotalRatings(allRatings.length)
      } else {
        setAverage(0)
        setTotalRatings(0)
      }

      // Cek rating user
      if (user) {
        const { data } = await supabase
          .from('ratings')
          .select('rating')
          .eq('novel_id', novelId)
          .eq('user_id', user.id)
          .maybeSingle()
        setUserRating(data?.rating ?? 0)
      } else {
        setUserRating(0)
      }

      setLoading(false)
    }
    load()
  }, [novelId, user])

  async function handleRate(value) {
    if (!user) {
      navigate('/login')
      return
    }

    // Kalau klik bintang yang sama dengan rating sekarang, hapus rating
    if (value === userRating) {
      await supabase
        .from('ratings')
        .delete()
        .eq('novel_id', novelId)
        .eq('user_id', user.id)
      setUserRating(0)
    } else {
      await supabase
        .from('ratings')
        .upsert(
          {
            novel_id: novelId,
            user_id: user.id,
            rating: value,
          },
          { onConflict: 'user_id,novel_id' }
        )
      setUserRating(value)
    }

    // Refresh rata-rata
    const { data: allRatings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('novel_id', novelId)

    if (allRatings && allRatings.length > 0) {
      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
      setAverage(sum / allRatings.length)
      setTotalRatings(allRatings.length)
    } else {
      setAverage(0)
      setTotalRatings(0)
    }
  }

  if (loading) return null

  const displayRating = hover || userRating || 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div
        style={{ display: 'flex', gap: 2 }}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= (hover || userRating)
          const isAverageFilled = !userRating && value <= Math.round(average)
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleRate(value)}
              onMouseEnter={() => setHover(value)}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                display: 'flex',
                transition: 'transform 0.1s',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title={`Kasih rating ${value} bintang`}
            >
              <Star
                size={size}
                fill={isFilled || isAverageFilled ? 'var(--gold)' : 'none'}
                color="var(--gold)"
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>

      {showAverage && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {totalRatings > 0 ? (
            <>
              <strong style={{ color: 'var(--gold)' }}>{average.toFixed(1)}</strong>
              {' '}({totalRatings} rating)
            </>
          ) : (
            'Belum ada rating'
          )}
          {userRating > 0 && (
            <span style={{ marginLeft: 6 }}>
              · Ratingmu: <strong style={{ color: 'var(--gold)' }}>{userRating}</strong>
            </span>
          )}
        </span>
      )}
    </div>
  )
    }
