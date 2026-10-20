import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { CreditCard, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QRModal({ shop, url, onClose }) {
  const qrRef = useRef(null)

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    const filename = `${shop.name.replace(/[^\w\s-]/g, '')}-${shop.card_code || 'qr'}.png`
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('QR code downloaded!')
  }

  function copyUrl() {
    navigator.clipboard.writeText(url)
    toast.success('URL copied!')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" style={{ textAlign: 'center', maxWidth: 440 }}>
        <div className="modal-header">
          <h2 className="modal-title">Review QR Code</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
            {shop.name}
          </h3>
          {shop.card_code ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(99,102,241,0.12)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <CreditCard size={13} /> Linked to Physical Card: {shop.card_code}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              Direct review link
            </p>
          )}
        </div>

        {/* QR Code */}
        <div ref={qrRef} style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '1rem',
          display: 'inline-block',
          marginBottom: '0.75rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
        }}>
          <QRCodeCanvas
            value={url}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        <p style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: 'var(--accent)',
          background: 'var(--bg-glass)',
          padding: '0.4rem 0.6rem',
          borderRadius: 6,
          wordBreak: 'break-all',
          marginBottom: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          {url}
        </p>

        {shop.card_code && (
          <p style={{ fontSize: '0.72rem', color: '#10b981', margin: '0 0 1rem 0' }}>
            ✓ Permanent card link — will never break even if the shop is renamed!
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button type="button" className="btn btn-ghost" onClick={copyUrl}>📋 Copy URL</button>
          <button type="button" className="btn btn-primary" onClick={downloadQR}>⬇ Download QR</button>
        </div>
      </div>
    </div>
  )
}
