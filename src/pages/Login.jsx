import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else navigate('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Cek email kamu buat konfirmasi akun.')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ paddingTop: 60, maxWidth: 380 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>
        {mode === 'signin' ? 'Masuk' : 'Daftar'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" className="btn btn--filled" disabled={loading}>
          {loading ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar'}
        </button>
      </form>

      {message && <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>{message}</p>}

      <button
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', marginTop: 20, cursor: 'pointer', padding: 0 }}
      >
        {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>
    </div>
  )
      }
