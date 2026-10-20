import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { adminSignIn, sendForgotPasswordEmail, verifyResetCodeAndSetPassword } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import './LoginPage.css'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'verify'
  const [email, setEmail] = useState('muhammedshafik9544@gmail.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session, signIn } = useAuth()

  useEffect(() => {
    if (session) {
      navigate('/admin/shops', { replace: true })
    }
  }, [session, navigate])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const authResult = await adminSignIn(email, password)
      signIn(authResult?.session || authResult?.user || email)
      toast.success('Welcome back!')
      navigate('/admin/shops', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendResetCode(e) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    setLoading(true)
    try {
      const res = await sendForgotPasswordEmail(email)
      toast.success(res.message || 'Reset code sent to your email!')
      if (res.devCode) {
        toast(`Dev Mode Code: ${res.devCode}`, { icon: '🔑', duration: 8000 })
      }
      setMode('verify')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyAndReset(e) {
    e.preventDefault()
    if (!resetCode.trim()) {
      toast.error('Please enter the 6-digit verification code')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await verifyResetCodeAndSetPassword(email, resetCode, newPassword)
      toast.success('Password reset successfully! Please sign in.')
      setPassword(newPassword)
      setMode('login')
      setResetCode('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">📲</div>
          <h1 className="login-title">NFC<span>Tap</span></h1>
          <p className="login-subtitle">
            {mode === 'login' && 'Admin Dashboard & NFC Card Provisioning'}
            {mode === 'forgot' && 'Reset Your Admin Password'}
            {mode === 'verify' && 'Enter Verification Code'}
          </p>
        </div>

        {/* 1. SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Admin Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="muhammedshafik9544@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.75rem' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : '🔓 Sign In'}
            </button>
          </form>
        )}

        {/* 2. FORGOT PASSWORD REQUEST FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleSendResetCode} className="login-form">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Enter your registered admin email. We will send a secure 6-digit code via <strong>Nodemailer</strong> to reset your password.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Admin Email</label>
              <input
                id="reset-email"
                className="form-input"
                type="email"
                placeholder="muhammedshafik9544@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Sending Code…</> : '📧 Send Reset Code'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={() => setMode('login')}
              disabled={loading}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* 3. VERIFY CODE & SET NEW PASSWORD */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyAndReset} className="login-form">
            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.825rem',
              color: 'var(--text-muted)'
            }}>
              Sent to: <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="code">6-Digit Verification Code</label>
              <input
                id="code"
                className="form-input"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={resetCode}
                onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25em', fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="new-pass"
                  className="form-input"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(p => !p)}
                  className="password-toggle-btn"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirm-pass"
                  className="form-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className="password-toggle-btn"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Saving Password…</> : '🔒 Reset Password'}
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => setMode('forgot')}
                disabled={loading}
              >
                Resend Code
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <p className="login-hint" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          🔒 Protected Admin Portal • Supabase Cloud
        </p>
      </div>
    </div>
  )
}
