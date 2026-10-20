import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X, Upload, ArrowRight, AlertCircle } from 'lucide-react'
import { extractCardCode } from '../../lib/api'
import toast from 'react-hot-toast'

export default function ScanCardModal({ isOpen, onClose, onCardDetected }) {
  const [manualCode, setManualCode] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef(null)
  const qrRegionId = 'qr-reader-viewport'

  useEffect(() => {
    if (!isOpen) return

    let html5QrCode = null
    const timer = setTimeout(() => {
      startCamera()
    }, 250)

    async function startCamera() {
      try {
        const container = document.getElementById(qrRegionId)
        if (!container) return

        html5QrCode = new Html5Qrcode(qrRegionId)
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            const code = extractCardCode(decodedText)
            if (code) {
              stopCamera()
              toast.success(`Scanned: ${code}`, { icon: '🎯' })
              onCardDetected(code)
            }
          },
          () => {
            // Frame scanned without QR match, ignore
          }
        )
        setCameraActive(true)
        setCameraError('')
      } catch (err) {
        console.warn('Camera start error:', err)
        setCameraActive(false)
        setCameraError('Camera access unavailable or blocked. You can type the Card ID below.')
      }
    }

    return () => {
      clearTimeout(timer)
      stopCamera()
    }
  }, [isOpen])

  function stopCamera() {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {})
        }
        scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
    setCameraActive(false)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    const code = extractCardCode(manualCode)
    if (!code) {
      toast.error('Please enter a valid Card ID (e.g. CARD-1001)')
      return
    }
    stopCamera()
    onCardDetected(code)
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const html5QrCode = new Html5Qrcode('file-qr-temp')
      const decodedText = await html5QrCode.scanFile(file, true)
      const code = extractCardCode(decodedText)
      html5QrCode.clear()
      if (code) {
        stopCamera()
        toast.success(`Detected: ${code}`, { icon: '🎯' })
        onCardDetected(code)
      } else {
        toast.error('No valid Card QR found in image')
      }
    } catch {
      toast.error('Could not detect QR code in this image')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--accent)" /> Scan QR / Card
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
            Point your device camera at the printed physical QR code, or enter the Card ID manually to assign it to a shop.
          </p>

          {/* Camera Viewfinder */}
          <div style={{
            position: 'relative',
            background: '#090d16',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--border)',
            overflow: 'hidden',
            minHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div id={qrRegionId} style={{ width: '100%', minHeight: 260 }} />
            <div id="file-qr-temp" style={{ display: 'none' }} />

            {cameraError && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                textAlign: 'center',
                background: 'rgba(10,12,20,0.92)',
                color: 'var(--text-muted)',
                gap: '0.5rem'
              }}>
                <AlertCircle size={32} color="#f59e0b" />
                <span style={{ fontSize: '0.85rem' }}>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Manual Input Alternative */}
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>
              Or Enter Card Code Manually:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-input"
                placeholder="e.g. CARD-1001"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                style={{ fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Assign <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* File Upload Option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={14} /> Scan from image file:
            </span>
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              Browse Image
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
