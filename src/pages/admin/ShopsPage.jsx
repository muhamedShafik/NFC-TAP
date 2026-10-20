import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getShops, deleteShop, toggleShopActive, getShopAnalytics, getShopSlug } from '../../lib/api'
import ShopModal from '../../components/admin/ShopModal'
import QRModal from '../../components/admin/QRModal'
import DeleteModal from '../../components/admin/DeleteModal'
import ScanCardModal from '../../components/admin/ScanCardModal'
import AssignCardModal from '../../components/admin/AssignCardModal'
import { Camera } from 'lucide-react'
import './ShopsPage.css'

function getReviewUrl(shop) {
  if (shop?.card_code) {
    return `${window.location.origin}/c/${shop.card_code}`
  }
  const slug = getShopSlug(shop)
  return `${window.location.origin}/r/${slug}`
}

export default function ShopsPage() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [shopModal, setShopModal] = useState({ open: false, shop: null })
  const [qrModal, setQrModal] = useState({ open: false, shop: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, shop: null, deleting: false })
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [assignModal, setAssignModal] = useState({ open: false, code: '' })
  const [stats, setStats] = useState({ taps: 0, clicks: 0 })

  useEffect(() => { loadShops() }, [])

  async function loadShops() {
    setLoading(true)
    try {
      const data = await getShops()
      setShops(data)
      // Aggregate stats
      let taps = 0, clicks = 0
      for (const s of data) {
        const a = await getShopAnalytics(s.id)
        taps += a.taps
        clicks += Object.values(a.clicks).reduce((acc, v) => acc + v, 0)
      }
      setStats({ taps, clicks })
    } catch {
      toast.error('Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  function handleDelete(shop) {
    setDeleteModal({ open: true, shop, deleting: false })
  }

  async function confirmDelete() {
    if (!deleteModal.shop) return
    setDeleteModal(prev => ({ ...prev, deleting: true }))
    try {
      await deleteShop(deleteModal.shop.id)
      toast.success(`"${deleteModal.shop.name}" deleted successfully`)
      setDeleteModal({ open: false, shop: null, deleting: false })
      loadShops()
    } catch {
      toast.error('Failed to delete shop')
      setDeleteModal(prev => ({ ...prev, deleting: false }))
    }
  }

  async function handleToggle(shop) {
    try {
      await toggleShopActive(shop.id, !shop.active)
      toast.success(shop.active ? 'Shop deactivated' : 'Shop activated')
      loadShops()
    } catch {
      toast.error('Failed to update')
    }
  }

  function copyUrl(shop) {
    navigator.clipboard.writeText(getReviewUrl(shop))
    toast.success('Review URL copied!')
  }

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Shops</h1>
          <p>Manage your NFC review cards</p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setScanModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Camera size={16} /> Scan Card to Assign
          </button>
          <button className="btn btn-primary" onClick={() => setShopModal({ open: true, shop: null })}>
            + Add Shop
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '🏪', label: 'Total Shops',    value: shops.length },
          { icon: '✅', label: 'Active Cards',    value: shops.filter(s => s.active).length },
          { icon: '👆', label: 'Total Taps',      value: stats.taps },
          { icon: '🔗', label: 'Platform Clicks', value: stats.clicks },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="shops-toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search shops…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="shops-count">{filtered.length} shop{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>{search ? 'No shops found' : 'No shops yet'}</h3>
          <p>{search ? 'Try a different name.' : 'Click "Add Shop" to create your first NFC review card.'}</p>
          {!search && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}
              onClick={() => setShopModal({ open: true, shop: null })}>
              + Add First Shop
            </button>
          )}
        </div>
      ) : (
        <div className="shops-grid">
          {filtered.map(shop => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onEdit={() => setShopModal({ open: true, shop })}
              onDelete={() => handleDelete(shop)}
              onToggle={() => handleToggle(shop)}
              onQR={() => setQrModal({ open: true, shop })}
              onCopyUrl={() => copyUrl(shop)}
              onPreview={() => window.open(getReviewUrl(shop), '_blank')}
              onAssignCard={() => setScanModalOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {shopModal.open && (
        <ShopModal
          shop={shopModal.shop}
          onClose={() => setShopModal({ open: false, shop: null })}
          onSaved={loadShops}
        />
      )}
      {qrModal.open && (
        <QRModal
          shop={qrModal.shop}
          url={getReviewUrl(qrModal.shop)}
          onClose={() => setQrModal({ open: false, shop: null })}
        />
      )}
      {deleteModal.open && (
        <DeleteModal
          shop={deleteModal.shop}
          deleting={deleteModal.deleting}
          onConfirm={confirmDelete}
          onClose={() => !deleteModal.deleting && setDeleteModal({ open: false, shop: null, deleting: false })}
        />
      )}

      {scanModalOpen && (
        <ScanCardModal
          isOpen={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          onCardDetected={(code) => {
            setScanModalOpen(false)
            setAssignModal({ open: true, code })
          }}
        />
      )}

      {assignModal.open && (
        <AssignCardModal
          cardCode={assignModal.code}
          isOpen={assignModal.open}
          onClose={() => setAssignModal({ open: false, code: '' })}
          onAssigned={() => loadShops()}
        />
      )}
    </div>
  )
}

function ShopCard({ shop, onEdit, onDelete, onToggle, onQR, onCopyUrl, onPreview, onAssignCard }) {
  const platforms = shop.platforms || []
  const hasCard = Boolean(shop.card_code)
  const displayUrl = hasCard ? `/c/${shop.card_code}` : `/r/${getShopSlug(shop)}`

  return (
    <div className="shop-card">
      <div className="shop-card-banner" style={{ background: shop.cover_color || '#6c63ff' }} />
      <div className="shop-card-body">
        <div className="shop-card-header">
          <div className="shop-logo">
            {(shop.logo || shop.logo_url)
              ? <img src={shop.logo || shop.logo_url} alt={shop.name} onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏪' }} />
              : '🏪'}
          </div>
          <div className="shop-meta">
            <div className="shop-name">{shop.name}</div>
            <div className="shop-tagline">{shop.tagline || <span style={{ color: 'var(--text-muted)' }}>No tagline</span>}</div>
            <span className={`badge ${shop.active ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.3rem', display: 'inline-flex' }}>
              {shop.active ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        {/* Physical Card / QR Standee Association */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          background: hasCard ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
          border: hasCard ? '1px solid rgba(99,102,241,0.25)' : '1px dashed var(--border)',
          fontSize: '0.78rem',
          margin: '0.65rem 0 0.5rem 0'
        }}>
          {hasCard ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💳</span>
              <span style={{ color: 'var(--text-muted)' }}>Card:</span>
              <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{shop.card_code}</strong>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>No physical card linked</span>
          )}

          {hasCard ? (
            <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              Permanent QR
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
              onClick={onAssignCard}
              title="Scan or assign a physical card to this shop"
            >
              + Link Card
            </button>
          )}
        </div>

        {/* Platforms */}
        <div className="shop-platforms">
          {platforms.length === 0
            ? <span className="platform-pill muted">No platforms</span>
            : platforms.slice(0, 4).map(p => (
                <span key={p.id} className="platform-pill">{p.type}</span>
              ))}
          {platforms.length > 4 && <span className="platform-pill">+{platforms.length - 4}</span>}
        </div>

        {/* URL Row */}
        <div className="shop-url-row">
          <span className="shop-url-text" title={displayUrl}>
            {displayUrl}
          </span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onCopyUrl} title="Copy QR Link">📋</button>
        </div>

        {/* Actions */}
        <div className="shop-actions">
          <button className="btn btn-ghost btn-sm" onClick={onQR} title="View & Download QR Code">🔳 QR</button>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={onPreview}>👁 Preview</button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggle}
            title={shop.active ? 'Deactivate' : 'Activate'}>
            {shop.active ? '⏸' : '▶️'}
          </button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={onDelete} title="Delete">🗑</button>
        </div>
      </div>
    </div>
  )
}
