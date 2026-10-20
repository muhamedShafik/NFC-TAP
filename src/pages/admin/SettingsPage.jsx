import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { sendForgotPasswordEmail, verifyResetCodeAndSetPassword } from '../../lib/api'
import toast from 'react-hot-toast'
import './SettingsPage.css'

export default function SettingsPage() {
  const { session, isDemoUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  
  // State for code-based verification in settings
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [codeNewPass, setCodeNewPass] = useState('')
  const [showCodeNewPass, setShowCodeNewPass] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  const adminEmail = session?.user?.email || 'muhammedshafik9544@gmail.com'
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'

  async function updatePassword(e) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      if (isDemoUser) {
        toast.success('Password updated for admin session!')
        setNewPassword('')
        setConfirmPassword('')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password successfully updated!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendResetEmail() {
    setSendingReset(true)
    try {
      const res = await sendForgotPasswordEmail(adminEmail)
      toast.success(res.message || `Reset email sent to ${adminEmail}`)
      if (res.devCode) {
        toast(`Dev Mode Code: ${res.devCode}`, { icon: '🔑', duration: 8000 })
      }
      setShowCodeInput(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setSendingReset(false)
    }
  }

  async function handleVerifyCodeReset(e) {
    e.preventDefault()
    if (!resetCode.trim()) {
      toast.error('Please enter the 6-digit verification code')
      return
    }
    if (codeNewPass.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setVerifyingCode(true)
    try {
      await verifyResetCodeAndSetPassword(adminEmail, resetCode, codeNewPass)
      toast.success('Password reset successfully via Nodemailer code!')
      setShowCodeInput(false)
      setResetCode('')
      setCodeNewPass('')
    } catch (err) {
      toast.error(err.message || 'Failed to reset password with code')
    } finally {
      setVerifyingCode(false)
    }
  }

  return (
    <div className="settings-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Admin security & NFC platform configurations</p>
        </div>
      </div>

      <div className="settings-grid">
        
        {/* Account & Security */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">
              <span>🔐</span> Account & Security
            </h3>
            <p className="settings-card-desc">
              Manage credentials for {adminEmail}
            </p>
          </div>

          <div className="settings-info-box" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Current Account</span>
              <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{adminEmail}</strong>
            </div>
            <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              🟢 Active
            </span>
          </div>

          {/* Direct Password Update */}
          <form onSubmit={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
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
              <label className="form-label">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={6}
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

            <div className="settings-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Updating…</> : 'Update Password'}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleSendResetEmail}
                disabled={sendingReset}
                title="Send a 6-digit OTP verification email via Nodemailer"
              >
                {sendingReset ? <><span className="spinner" /> Sending…</> : '📧 Send Reset Email'}
              </button>
            </div>
          </form>

          {/* Nodemailer Code Verification Panel */}
          {showCodeInput && (
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              marginTop: '0.5rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
                📩 Nodemailer Verification Code Received?
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                Enter the 6-digit code sent to <strong>{adminEmail}</strong> to reset your password immediately:
              </p>

              <form onSubmit={handleVerifyCodeReset} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">6-Digit Code</label>
                  <input
                    className="form-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      className="form-input"
                      type={showCodeNewPass ? 'text' : 'password'}
                      placeholder="New password (min 6 chars)"
                      minLength={6}
                      value={codeNewPass}
                      onChange={e => setCodeNewPass(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCodeNewPass(p => !p)}
                      className="password-toggle-btn"
                      aria-label={showCodeNewPass ? 'Hide password' : 'Show password'}
                      title={showCodeNewPass ? 'Hide password' : 'Show password'}
                    >
                      {showCodeNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={verifyingCode}>
                    {verifyingCode ? <><span className="spinner" /> Verifying…</> : 'Confirm & Save'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCodeInput(false)}>
                    Close
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* NFC Card Hardware & Tagging Info */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">
              <span>📲</span> NFC Card Programming
            </h3>
            <p className="settings-card-desc">
              Card encoding specifications for physical review cards
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div className="settings-info-box">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                NFC Target URL Format
              </span>
              <code style={{ color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}>
                {originUrl}/r/[shop-id]
              </code>
            </div>

            <div className="settings-info-box">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                Recommended NFC Chips
              </span>
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                <strong>NTAG213 / NTAG215 / NTAG216</strong> (Fully compatible with iOS & Android)
              </p>
            </div>

            <div className="settings-info-box">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                Recommended Mobile Writer
              </span>
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                Use <strong>NFC Tools</strong> (iOS App Store & Google Play) to flash URLs to tags in 1-tap.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
