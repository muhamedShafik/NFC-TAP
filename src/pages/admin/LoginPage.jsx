import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminSignIn } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import './LoginPage.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { demoSignIn, supabaseConfigured } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await adminSignIn(email, password)
      toast.success('Welcome back!')
      navigate('/admin/shops')
    } catch (err) {
      toast.error(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    demoSignIn()
    toast.success('Logged in as Admin (Demo Mode)!')
    navigate('/admin/shops')
  }

  return (
    <div className="login-page">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">📲</div>
          <h1 className="login-title">NFC<span>Tap</span></h1>
          <p className="login-subtitle">Admin Dashboard & NFC Card Provisioning</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              placeholder="admin@yourshop.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '.5rem' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" />Signing in…</> : '🔓 Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.25rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn btn-ghost"
          style={{
            width: '100%',
            border: '1px solid var(--accent)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontWeight: 600
          }}
        >
          ⚡ Instant Demo Admin Access
        </button>

        <p className="login-hint" style={{ marginTop: '1.25rem' }}>
          {supabaseConfigured ? (
            <span style={{ color: '#22c55e' }}>● Supabase Cloud Connected</span>
          ) : (
            <span>
              ℹ️ Supabase not yet configured in <code>.env.local</code>.
              <br />Use <strong>Instant Demo</strong> to test all features now!
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
