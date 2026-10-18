import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function QRModal({ shop, url, onClose }) {
  const qrRef = useRef(null)

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${shop.name}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('QR downloaded!')
  }

  function copyUrl() {
    navigator.clipboard.writeText(url)
    toast.success('URL copied!')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" style={{ textAlign: 'center' }}>
        <div className="modal-header">
          <h2 className="modal-title">QR Code</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {shop.name}
        </p>

        {/* QR Code */}
        <div ref={qrRef} style={{
          background: '#fff', borderRadius: '12px', padding: '1rem',
          display: 'inline-block', marginBottom: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <QRCodeCanvas
            value={url}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '1.25rem' }}>
          {url}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={copyUrl}>📋 Copy URL</button>
          <button className="btn btn-primary" onClick={downloadQR}>⬇ Download QR</button>
        </div>
      </div>
    </div>
  )
}
