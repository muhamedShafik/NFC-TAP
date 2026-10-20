import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { getShops, getShopSlug } from '../../lib/api'
import toast from 'react-hot-toast'

function getReviewUrl(shop) {
  const slug = getShopSlug(shop)
  return `${window.location.origin}/r/${slug}`
}

export default function BulkQRPage() {
  const [shops, setShops] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [size, setSize] = useState(200)
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(true)
  const qrContainerRef = useRef(null)

  useEffect(() => {
    getShops().then(data => {
      setShops(data)
      setSelected(new Set(data.map(s => s.id)))
      setLoading(false)
    }).catch(() => { toast.error('Failed to load shops'); setLoading(false) })
  }, [])

  function toggleSelect(id) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function selectAll() { setSelected(new Set(shops.map(s => s.id))) }
  function deselectAll() { setSelected(new Set()) }

  function generate() {
    if (selected.size === 0) { toast.error('Select at least one shop'); return }
    setGenerated(true)
    toast.success(`${selected.size} QR code(s) generated!`)
  }

  async function downloadAll() {
    const { default: JSZip } = await import('jszip')
    const { saveAs } = await import('file-saver')
    const zip = new JSZip()

    const canvases = qrContainerRef.current?.querySelectorAll('[data-shopid] canvas')
    if (!canvases?.length) return

    const promises = [...canvases].map(canvas => {
      return new Promise(resolve => {
        const shopId = canvas.closest('[data-shopid]').dataset.shopid
        const shop = shops.find(s => s.id === shopId)
        canvas.toBlob(blob => {
          zip.file(`${shop?.name || shopId}-qr.png`, blob)
          resolve()
        })
      })
    })

    await Promise.all(promises)
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, 'nfc-tap-qr-codes.zip')
    toast.success('ZIP downloaded!')
  }

  function downloadSingle(shop, canvas) {
    const link = document.createElement('a')
    link.download = `${shop.name}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const selectedShops = shops.filter(s => selected.has(s.id))

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Bulk QR Generator</h1>
          <p>Generate and download QR codes for all your shops</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 760 }}>
        {/* Shop Selector */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Select Shops</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {selected.size} of {shops.length} selected
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={selectAll}>All</button>
            <button className="btn btn-ghost btn-sm" onClick={deselectAll}>None</button>
          </div>
          {loading ? <div className="spinner" style={{ margin: '1rem auto', display: 'block' }} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
              {shops.map(shop => (
                <label key={shop.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.625rem', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', transition: 'var(--transition)',
                  background: selected.has(shop.id) ? 'var(--accent-soft)' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={selected.has(shop.id)}
                    onChange={() => toggleSelect(shop.id)}
                    style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                  />
                  <div
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: shop.cover_color || 'var(--accent)',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{shop.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Options</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure your QR codes</p>
          </div>
          <div className="form-group">
            <label className="form-label">QR Size</label>
            <select className="form-select" value={size} onChange={e => setSize(Number(e.target.value))}>
              <option value={128}>Small (128px)</option>
              <option value={200}>Medium (200px)</option>
              <option value={300}>Large (300px)</option>
              <option value={400}>Print (400px)</option>
            </select>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-lg" onClick={generate} disabled={selected.size === 0}>
              🔳 Generate {selected.size > 0 ? `${selected.size} QR Code${selected.size > 1 ? 's' : ''}` : ''}
            </button>
            {generated && (
              <button className="btn btn-ghost" onClick={downloadAll}>
                📦 Download All as ZIP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated QRs */}
      {generated && (
        <div style={{ marginTop: '2rem' }}>
          <div className="divider" />
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
            Generated QR Codes
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              ({selectedShops.length})
            </span>
          </h3>
          <div
            ref={qrContainerRef}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}
          >
            {selectedShops.map(shop => (
              <QRCard key={shop.id} shop={shop} size={size} onDownload={downloadSingle} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QRCard({ shop, size, onDownload }) {
  const ref = useRef(null)
  const url = getReviewUrl(shop)

  return (
    <div data-shopid={shop.id} className="card" style={{ textAlign: 'center' }}>
      <div ref={ref} style={{
        background: '#fff', borderRadius: '8px', padding: '0.75rem',
        display: 'inline-block', marginBottom: '0.75rem'
      }}>
        <QRCodeCanvas value={url} size={size} level="H" />
      </div>
      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{shop.name}</p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
        {url}
      </p>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}
        onClick={() => {
          const canvas = ref.current?.querySelector('canvas')
          if (canvas) onDownload(shop, canvas)
        }}>
        ⬇ Download
      </button>
    </div>
  )
}
