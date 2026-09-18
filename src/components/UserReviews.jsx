import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MessageCircle, Loader, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

const REVIEWS_PER_PAGE = 5

export default function UserReviews({ userId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (!userId) return
    loadReviews(true)
  }, [userId])

  async function loadReviews(reset = false) {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    const offset = reset ? 0 : reviews.length
    const limit = REVIEWS_PER_PAGE

    const { data: reviewsData } = await supabase
      .from('novel_reviews')
      .select('id, rating, content, has_spoiler, created_at, novel_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!reviewsData || reviewsData.length === 0) {
      if (reset) setReviews([])
      setHasMore(false)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    // Fetch novel info
    const novelIds = [...new Set(reviewsData.map((r) => r.novel_id))]
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, slug, cover_url, author')
      .in('id', novelIds)

    const novelsMap = {}
    ;(novelsData ?? []).forEach((n) => {
      novelsMap[n.id] = n
    })

    // Count replies per review
    const reviewIds = reviewsData.map((r) => r.id)
    const { data: repliesData } = await supabase
      .from('review_replies')
      .select('review_id')
      .in('review_id', reviewIds)

    const replyCounts = {}
    ;(repliesData ?? []).forEach((r) => {
      replyCounts[r.review_id] = (replyCounts[r.review_id] || 0) + 1
    })

    const mapped = reviewsData.map((r) => ({
      ...r,
      novel: novelsMap[r.novel_id] || null,
      replyCount: replyCounts[r.id] || 0,
    }))

    const newReviews = reset ? mapped : [...reviews, ...mapped]
    setReviews(newReviews)
    setHasMore(reviewsData.length === limit)
    setLoading(false)
    setLoadingMore(false)
  }

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat review...</p>
  }

  if (reviews.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Belum ada review yang ditulis.
      </p>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reviews.map((r) => {
          // URL ke halaman novel + anchor ke review
          const url = r.novel ? `/novel/${r.novel.slug}#review-${r.id}` : '#'

          return (
            <Link
              key={r.id}
              to={url}
              className="card"
              style={{
                padding: 12,
                display: 'flex',
                gap: 12,
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              {/* Cover novel */}
              {r.novel && (
                <div
                  style={{
                    width: 48,
                    height: 66,
                    flexShrink: 0,
                    background: r.novel.cover_url
                      ? `url(${r.novel.cover_url}) center/cover`
                      : 'var(--border)',
                    borderRadius: 'var(--radius)',
                  }}
                />
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                {/* Judul novel + rating */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {r.novel && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                      {r.novel.title}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        size={11}
                        fill={v <= (r.rating || 0) ? 'var(--gold)' : 'none'}
                        color="var(--gold)"
                      />
                    ))}
                  </div>
                </div>

                {/* Cuplikan review */}
                <p
                  style={{
                    margin: '4px 0 6px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.content}
                </p>

                {/* Footer info */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {new Date(r.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {r.replyCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MessageCircle size={11} />
                      {r.replyCount}
                    </span>
                  )}
                  {r.has_spoiler && <span style={{ color: '#D46B5B' }}>⚠ Spoiler</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={() => loadReviews(false)}
            className="btn"
            disabled={loadingMore}
            style={{ fontSize: '0.85rem' }}
          >
            {loadingMore ? <Loader size={14} className="spin" /> : <ChevronDown size={14} />}
            {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
          </button>
        </div>
      )}
    </>
  )
                  }
