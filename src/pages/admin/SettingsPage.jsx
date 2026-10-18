import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { session, isDemoUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const adminEmail = session?.user?.email || 'admin@nfc-tap.local'
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
        toast.success('Password updated locally for demo admin!')
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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Admin security & NFC platform configurations</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', maxWidth: 900 }}>
        
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

          <form onSubmit={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? <><span className="spinner" /> Updating…</> : 'Update Password'}
            </button>
          </form>
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

      </div>
    </div>
  )
}
