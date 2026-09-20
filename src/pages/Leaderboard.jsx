import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
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
    1: { border: 'var(--gold)', bg: 'rgba(212, 175, 91, 0.08)' },
    2: { border: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.06)' },
    3: { border: '#CD7F32', bg: 'rgba(205, 127, 50, 0.06)' },
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Trophy size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Wall of Fame</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        Pembaca teraktif di Heaven's Quill — berdasarkan jumlah chapter yang dibaca.
      </p>

      {/* Tab filter waktu */}
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

      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Memuat...</p>}

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
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: 16,
                    border: `2px solid ${colors.border}`,
                    background: colors.bg,
                    textDecoration: 'none',
                    color: 'inherit',
                    minHeight: 230,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    #{r.rank} {isChampion && '👑'}
                  </div>

                  <div
                    style={{
                      width: isChampion ? 72 : 60,
                      height: isChampion ? 72 : 60,
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

                  <div
                    style={{
                      fontSize: '0.85rem',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

      {/* CSS untuk podium responsive */}
      <style>{`
        .podium-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 32px;
        }
        @media (min-width: 700px) {
          .podium-grid {
            grid-template-columns: repeat(3, 1fr);
            align-items: end;
            max-width: 720px;
            margin: 0 auto 32px;
          }
          /* Champion lebih tinggi di desktop */
          .podium-grid > a:nth-child(2) {
            transform: translateY(-16px);
          }
        }
        @media (max-width: 699px) {
          /* Di HP, champion tetap paling atas (urutan sudah dari backend: #2, #1, #3) */
          /* Kita tetap tampilkan urutannya, tapi full width */
        }
      `}</style>
    </div>
  )
                      }
