import { useState, useEffect } from 'react'
import { Eye, EyeOff, Database, Copy, Check, Smartphone, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { sendForgotPasswordEmail, verifyResetCodeAndSetPassword } from '../../lib/api'
import InstallPwaModal from '../../components/common/InstallPwaModal'
import { isStandalone, isIOS, isAndroid } from '../../registerServiceWorker'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { session, isDemoUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)
  const [isInstalledApp, setIsInstalledApp] = useState(isStandalone())
  
  // State for code-based verification in settings
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [codeNewPass, setCodeNewPass] = useState('')
  const [showCodeNewPass, setShowCodeNewPass] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  const [copiedSql, setCopiedSql] = useState(false)

  const adminEmail = session?.user?.email || 'muhammedshafik9544@gmail.com'
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not connected'

  const rlsFixSql = `-- 1. Disable RLS so shops, platforms & analytics can be read and written freely:
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;

-- 2. Optional: Create cards table if you want bulk card inventory in Supabase:
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  batch_name TEXT DEFAULT 'Batch 1',
  status TEXT DEFAULT 'unassigned',
  shop_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ
);
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;`

  function copyRlsSql() {
    navigator.clipboard.writeText(rlsFixSql)
    setCopiedSql(true)
    toast.success('SQL copied to clipboard! Paste it into Supabase SQL Editor.')
    setTimeout(() => setCopiedSql(false), 3000)
  }

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
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Admin security & NFC platform configurations</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', maxWidth: 960 }}>
        
        {/* Account & Security */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔐</span> Account & Security
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Manage credentials for {adminEmail}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-glass)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Current Account</span>
              <strong style={{ color: 'var(--text-primary)' }}>{adminEmail}</strong>
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

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                {sendingReset ? <><span className="spinner" /> Sending…</> : '📧 Send Reset Email (Nodemailer)'}
              </button>
            </div>
          </form>

          {/* Nodemailer Code Verification Panel */}
          {showCodeInput && (
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
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

                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📲</span> NFC Card Programming
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Card encoding specifications for physical review cards
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div style={{
              background: 'var(--bg-glass)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                NFC Target URL Format
              </span>
              <code style={{ color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}>
                {originUrl}/r/[shop-id]
              </code>
            </div>

            <div style={{
              background: 'var(--bg-glass)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                Recommended NFC Chips
              </span>
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                <strong>NTAG213 / NTAG215 / NTAG216</strong> (Fully compatible with iOS & Android)
              </p>
            </div>

            <div style={{
              background: 'var(--bg-glass)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                Recommended Mobile Writer
              </span>
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                Use <strong>NFC Tools</strong> (iOS App Store & Google Play) to flash URLs to tags in 1-tap.
              </p>
            </div>
          </div>
        </div>

        {/* Supabase Database Connection Status */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: '1/-1' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--accent)" /> Supabase Database & Cloud Storage
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Live connection status between your NFC application and Supabase PostgreSQL database
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: 'var(--bg-glass)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                Storage Mode
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge" style={{
                  background: supabaseConfigured ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: supabaseConfigured ? '#10b981' : '#f59e0b',
                  border: `1px solid ${supabaseConfigured ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                }}>
                  {supabaseConfigured ? '🟢 Connected to Supabase Cloud' : '⚠️ Local Storage (Demo Mode)'}
                </span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-glass)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                Supabase Project URL
              </span>
              <code style={{ color: 'var(--accent)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                {supabaseUrl}
              </code>
            </div>
          </div>

          <div style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  ⚡ Supabase Row Level Security (RLS) Permission Fix
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  If you ever see <code>new row violates row-level security policy</code> when adding or modifying shops, run this SQL in your Supabase SQL Editor:
                </p>
              </div>
              <button
                type="button"
                onClick={copyRlsSql}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'Copied SQL!' : 'Copy SQL Fix'}
              </button>
            </div>

            <pre style={{
              margin: 0,
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              color: '#38bdf8',
              overflowX: 'auto',
              border: '1px solid rgba(255,255,255,0.07)'
            }}>
              {rlsFixSql}
            </pre>
          </div>
        </div>

        {/* PWA & Mobile App Section */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
                <Smartphone size={20} style={{ color: 'var(--accent)' }} />
                Progressive Web App (PWA) & Mobile
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                High-compatibility standalone mobile app for Android, iOS Safari, and Desktop Chrome.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setPwaModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Smartphone size={15} />
              {isInstalledApp ? 'View App Details' : 'Install App on this Device'}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                Installation Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                {isInstalledApp ? (
                  <>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9rem' }}>Installed (Standalone)</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Running in Browser</span>
                  </>
                )}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                Current Platform
              </span>
              <div style={{ marginTop: '0.35rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {isIOS() ? '🍎 Apple iOS (Safari / WebKit)' : isAndroid() ? '🤖 Android (Chrome / Web)' : '💻 Desktop / Other Browser'}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                Offline Cache & Shell
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                <Sparkles size={16} style={{ color: '#818cf8' }} />
                <span style={{ fontWeight: 600, color: '#818cf8', fontSize: '0.9rem' }}>Service Worker Active</span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Icons: 192px, 512px, Maskable & Apple Touch 180px configured in <code>manifest.json</code>.
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations()
                  for (let r of regs) await r.update()
                  toast.success('Service Worker cache checked & refreshed')
                } else {
                  toast('Service worker not supported in this environment')
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} /> Check Cache Updates
            </button>
          </div>
        </div>

      </div>

      {/* PWA Modal */}
      {pwaModalOpen && (
        <InstallPwaModal
          isOpen={pwaModalOpen}
          onClose={() => setPwaModalOpen(false)}
        />
      )}
    </div>
  )
}
