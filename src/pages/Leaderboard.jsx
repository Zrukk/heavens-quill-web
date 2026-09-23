import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { getLevelInfo } from '../lib/levelSystem'

const PERIODS = [
  { id: 'all', label: 'Sepanjang Masa' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'week', label: 'Minggu Ini' },
  { id: 'day', label: 'Hari Ini' },
]

export default function Leaderboard() {
  const [readers, setReaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useDocumentMeta(
    "Wall of Fame — Heaven's Quill",
    "Pembaca teraktif di Heaven's Quill. Lihat ranking pembaca berdasarkan jumlah chapter yang dibaca.",
  )

  useEffect(() => {
    load()
  }, [period])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_top_readers', {
      limit_count: 10,
      period: period,
    })
    if (!error) setReaders(data ?? [])
    else setReaders([])
    setLoading(false)
  }

  const top3 = readers.slice(0, 3)
  const rest = readers.slice(3, 10)

  const podiumOrder = [
    top3[1] ? { ...top3[1], rank: 2 } : null,
    top3[0] ? { ...top3[0], rank: 1 } : null,
    top3[2] ? { ...top3[2], rank: 3 } : null,
  ].filter(Boolean)

  const rankColors = {
    1: { border: 'var(--gold)', bg: 'linear-gradient(180deg, rgba(212, 175, 91, 0.15), rgba(212, 175, 91, 0.03))', glow: '0 0 32px rgba(212, 175, 91, 0.35)' },
    2: { border: '#C0C0C0', bg: 'linear-gradient(180deg, rgba(192, 192, 192, 0.1), rgba(192, 192, 192, 0.02))', glow: '0 0 20px rgba(192, 192, 192, 0.2)' },
    3: { border: '#CD7F32', bg: 'linear-gradient(180deg, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.02))', glow: '0 0 20px rgba(205, 127, 50, 0.2)' },
  }

  return (
    <div className="leaderboard-wrapper">
      {/* BACKGROUND DECORATION */}
      <div className="leaderboard-bg-glow-1" />
      <div className="leaderboard-bg-glow-2" />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900, position: 'relative', zIndex: 1 }}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Trophy size={26} color="var(--gold)" strokeWidth={1.75} />
          <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Wall of Fame</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Pembaca teraktif di Heaven's Quill — berdasarkan jumlah chapter yang dibaca.
        </p>

        {/* TAB FILTER */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32, flexWrap: 'wrap' }}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={period === p.id ? 'btn btn--gold' : 'btn'}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Memuat...</p>
        )}

        {!loading && readers.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Belum ada aktivitas pembaca di periode ini.
          </p>
        )}

        {!loading && readers.length > 0 && (
          <>
            {/* PODIUM TOP 3 */}
            <div className="podium-grid">
              {podiumOrder.map((r) => {
                const colors = rankColors[r.rank]
                const isChampion = r.rank === 1
                const levelInfo = getLevelInfo(r.total_chapters)

                return (
                  <Link
                    key={r.user_id}
                    to={`/pembaca/${r.user_id}`}
                    className="podium-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: isChampion ? 20 : 16,
                      border: `2px solid ${colors.border}`,
                      background: colors.bg,
                      textDecoration: 'none',
                      color: 'inherit',
                      borderRadius: 'var(--radius)',
                      minHeight: isChampion ? 260 : 230,
                      boxShadow: colors.glow,
                      position: 'relative',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = `0 0 40px ${colors.border}66`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = colors.glow
                    }}
                  >
                    {/* CROWN untuk Top 1 */}
                    {isChampion && (
                      <div className="crown-anim" style={{ position: 'absolute', top: -20 }}>
                        <Crown size={32} color="var(--gold)" fill="var(--gold)" strokeWidth={1.5} />
                      </div>
                    )}

                    {/* Rank badge */}
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginTop: isChampion ? 12 : 0,
                      }}
                    >
                      #{r.rank}
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
                        flexShrink: 0,
                      }}
                    >
                      {!r.avatar_url && '👤'}
                    </div>

                    {/* Name */}
                    <div
                      style={{
                        fontSize: isChampion ? '1.05rem' : '0.9rem',
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

                    {/* Level */}
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: levelInfo.color,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        textAlign: 'center',
                      }}
                    >
                      Lv.{levelInfo.level} · {levelInfo.title}
                    </div>

                    {/* Title */}
                    {r.title_name && (
                      <div
                        title={r.title_name}
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--gold)',
                          border: '1px solid var(--gold)',
                          borderRadius: 12,
                          padding: '2px 8px',
                          background: 'rgba(212, 175, 91, 0.08)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>{r.title_icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.title_name}
                        </span>
                      </div>
                    )}

                    {/* Score */}
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--gold)',
                        fontWeight: 700,
                        marginTop: 'auto',
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rest.map((r, i) => {
                    const rank = i + 4
                    const levelInfo = getLevelInfo(r.total_chapters)

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

                        <div
                          style={{
                            width: 40,
                            height: 40,
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

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r.display_name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: levelInfo.color,
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            Lv.{levelInfo.level} · {levelInfo.title}
                            {r.title_name && (
                              <span style={{ color: 'var(--gold)', marginLeft: 6 }}>
                                · {r.title_icon} {r.title_name}
                              </span>
                            )}
                          </div>
                        </div>

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
          </>
        )}

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

      {/* CSS */}
      <style>{`
        .leaderboard-wrapper {
          position: relative;
          overflow: hidden;
          min-height: calc(100vh - 60px);
        }
        .leaderboard-bg-glow-1 {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212, 175, 91, 0.15), transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .leaderboard-bg-glow-2 {
          position: absolute;
          bottom: -150px;
          left: -150px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91, 168, 212, 0.1), transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .podium-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (min-width: 700px) {
          .podium-grid {
            grid-template-columns: repeat(3, 1fr);
            align-items: end;
            max-width: 720px;
            margin: 0 auto 32px;
          }
          .podium-card:nth-child(2) {
            transform: translateY(-20px);
          }
          .podium-card:nth-child(2):hover {
            transform: translateY(-24px) !important;
          }
        }
        /* Crown animation */
        .crown-anim {
          animation: crownFloat 2s ease-in-out infinite;
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
                     }
