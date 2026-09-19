import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, BookOpen, Medal, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Leaderboard() {
  const [readers, setReaders] = useState([])
  const [loading, setLoading] = useState(true)

  useDocumentMeta(
    'Wall of Fame — Heaven\'s Quill',
    'Pembaca teraktif di Heaven\'s Quill. Lihat ranking pembaca berdasarkan jumlah chapter yang dibaca.',
  )

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_top_readers', { limit_count: 10 })
      if (!error) setReaders(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>

  if (readers.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Trophy size={26} color="var(--gold)" strokeWidth={1.75} />
          <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Wall of Fame</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Belum ada aktivitas pembaca.</p>
      </div>
    )
  }

  const top3 = readers.slice(0, 3)
  const rest = readers.slice(3, 10)

  // Susun podium: #2 kiri, #1 tengah, #3 kanan
  const podiumOrder = [
    top3[1] ? { ...top3[1], rank: 2 } : null, // kiri
    top3[0] ? { ...top3[0], rank: 1 } : null, // tengah
    top3[2] ? { ...top3[2], rank: 3 } : null, // kanan
  ].filter(Boolean)

  const rankColors = {
    1: { border: 'var(--gold)', bg: 'rgba(212, 175, 91, 0.08)', label: '🥇', crown: true },
    2: { border: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.06)', label: '🥈', crown: false },
    3: { border: '#CD7F32', bg: 'rgba(205, 127, 50, 0.06)', label: '🥉', crown: false },
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Trophy size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Wall of Fame</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Pembaca teraktif di Heaven's Quill — berdasarkan jumlah chapter yang dibaca.
      </p>

      {/* PODIUM TOP 3 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 12,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        {podiumOrder.map((r, i) => {
          const colors = rankColors[r.rank]
          // Rank 1 lebih tinggi
          const isChampion = r.rank === 1
          return (
            <Link
              key={r.user_id}
              to={`/pembaca/${r.user_id}`}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: isChampion ? 20 : 16,
                width: isChampion ? 180 : 150,
                border: `2px solid ${colors.border}`,
                background: colors.bg,
                textDecoration: 'none',
                color: 'inherit',
                transform: isChampion ? 'translateY(-20px)' : 'translateY(0)',
                marginTop: isChampion ? 0 : 20,
              }}
            >
              {/* Rank label */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                #{r.rank} {isChampion && '👑'}
              </div>

              {/* Avatar */}
              <div
                style={{
                  width: isChampion ? 80 : 64,
                  height: isChampion ? 80 : 64,
                  borderRadius: '50%',
                  background: r.avatar_url
                    ? `url(${r.avatar_url}) center/cover`
                    : 'var(--border)',
                  border: `2px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'var(--text-muted)',
                }}
              >
                {!r.avatar_url && '👤'}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: isChampion ? '1rem' : '0.9rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {r.display_name}
              </div>

              {/* Chapter count */}
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--gold)',
                  fontWeight: 700,
                }}
              >
                {Number(r.total_chapters).toLocaleString('id-ID')} BAB
              </div>
            </Link>
          )
        })}
      </div>

      {/* RANKING 4-10 */}
      {rest.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 12px 8px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              borderBottom: '1px solid var(--border)',
              marginBottom: 8,
            }}
          >
            <span>Peringkat 4 — {readers.length}</span>
            <span>Skor</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rest.map((r, i) => {
              const rank = i + 4
              return (
                <Link
                  key={r.user_id}
                  to={`/pembaca/${r.user_id}`}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  {/* Rank number */}
                  <div
                    style={{
                      width: 28,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {rank}
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: r.avatar_url
                        ? `url(${r.avatar_url}) center/cover`
                        : 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {!r.avatar_url && '👤'}
                  </div>

                  {/* Name */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.display_name}
                  </div>

                  {/* Count */}
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--gold)',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {Number(r.total_chapters).toLocaleString('id-ID')} BAB
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Info kecil */}
      <p
        style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          marginTop: 32,
        }}
      >
        💡 Chapter yang dibaca berulang kali tetap dihitung satu.
      </p>
    </div>
  )
          }
