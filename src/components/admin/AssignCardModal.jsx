import { useState, useEffect } from 'react'
import { getShops, createShop, assignCardToShop, getCardByCode, getCardUrl, slugify } from '../../lib/api'
import { PLATFORMS } from '../../lib/platforms.jsx'
import { CreditCard, PlusCircle, Link, Check, ExternalLink } from 'lucide-react'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'

const COLORS = [
  '#6c63ff', '#f59e0b', '#10b981', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'
]

export default function AssignCardModal({ cardCode, isOpen, onClose, onAssigned }) {
  const [tab, setTab] = useState('new') // 'new' | 'existing'
  const [existingShops, setExistingShops] = useState([])
  const [selectedShopId, setSelectedShopId] = useState('')
  const [cardInfo, setCardInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New Shop form fields
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [color, setColor] = useState('#6c63ff')
  const [platforms, setPlatforms] = useState([
    { type: 'google', url: '' }
  ])

  useEffect(() => {
    if (!isOpen || !cardCode) return
    setLoading(true)

    Promise.all([
      getShops(),
      getCardByCode(cardCode)
    ]).then(([shops, card]) => {
      setExistingShops(shops || [])
      setCardInfo(card)
      if (shops && shops.length > 0) {
        setSelectedShopId(shops[0].id)
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [isOpen, cardCode])

  function addPlatform(type) {
    if (platforms.some(p => p.type === type)) return
    setPlatforms(prev => [...prev, { type, url: '' }])
  }

  function removePlatform(type) {
    setPlatforms(prev => prev.filter(p => p.type !== type))
  }

  function updatePlatformUrl(type, url) {
    setPlatforms(prev => prev.map(p => p.type === type ? { ...p, url } : p))
  }

  async function handleAssignExisting(e) {
    e.preventDefault()
    if (!selectedShopId) {
      toast.error('Please choose a shop')
      return
    }

    const shop = existingShops.find(s => s.id === selectedShopId)

    if (cardInfo?.status === 'assigned') {
      const confirm = await Swal.fire({
        title: 'Reassign Card?',
        html: `Card <b style="color:#818cf8; font-family:monospace;">${cardCode}</b> is currently assigned to <b>${cardInfo.shop_name || 'another shop'}</b>.<br/><br/>Do you want to reassign it to <b>${shop?.name}</b>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Reassign',
        cancelButtonText: 'Cancel',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#334155'
      })
      if (!confirm.isConfirmed) return
    }

    setSaving(true)
    try {
      await assignCardToShop(cardCode, selectedShopId)
      toast.success(`Card ${cardCode} assigned to ${shop?.name || 'shop'}!`)
      if (cardInfo?.status === 'assigned') {
        Swal.fire({
          title: 'Card Reassigned!',
          html: `Card <b style="color:#818cf8; font-family:monospace;">${cardCode}</b> is now linked to <b>${shop?.name}</b>.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc'
        })
      }
      onAssigned?.(shop, cardCode)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to assign card')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateAndAssign(e) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a shop name')
      return
    }

    if (cardInfo?.status === 'assigned') {
      const confirm = await Swal.fire({
        title: 'Reassign Card to New Shop?',
        html: `Card <b style="color:#818cf8; font-family:monospace;">${cardCode}</b> is currently assigned to <b>${cardInfo.shop_name || 'another shop'}</b>.<br/><br/>Do you want to reassign it to new shop <b>${name.trim()}</b>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Reassign',
        cancelButtonText: 'Cancel',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#334155'
      })
      if (!confirm.isConfirmed) return
    }

    setSaving(true)
    try {
      const cleanSlug = slugify(name.trim())
      const shopPayload = {
        name: name.trim(),
        slug: cleanSlug,
        tagline: tagline.trim(),
        cover_color: color,
        platforms: platforms.filter(p => p.url.trim()),
      }

      // 1. Create shop in database
      const newShop = await createShop(shopPayload)

      // 2. Assign card to this new shop
      await assignCardToShop(cardCode, newShop.id)

      toast.success(`Shop created and card ${cardCode} activated!`)
      if (cardInfo?.status === 'assigned') {
        Swal.fire({
          title: 'Card Reassigned!',
          html: `Card <b style="color:#818cf8; font-family:monospace;">${cardCode}</b> has been linked to <b>${newShop.name}</b>.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc'
        })
      }
      onAssigned?.(newShop, cardCode)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to create shop and assign card')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const targetUrl = getCardUrl(cardCode)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--accent)" /> Assign Card {cardCode}
            </h2>
            <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Card Link: <code style={{ color: 'var(--accent)', fontWeight: 600 }}>{targetUrl}</code>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Current status header */}
        {cardInfo?.status === 'assigned' && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: '#f59e0b'
          }}>
            ⚠️ This card is currently assigned to <strong>{cardInfo.shop_name || cardInfo.shop_id}</strong>. Re-assigning will point this card to the new shop.
          </div>
        )}

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'new' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('new')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={15} /> + Create New Shop
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('existing')}
            disabled={existingShops.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Link size={15} /> Assign Existing Shop ({existingShops.length})
          </button>
        </div>

        {tab === 'new' ? (
          /* TAB 1: Create New Shop & Assign */
          <form onSubmit={handleCreateAndAssign}>
            <div className="modal-grid">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Shop Name *</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Royal Barber Lounge"
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Tagline / Bio</label>
                <input
                  className="form-input"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Premium haircuts & grooming since 2018"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Brand Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c,
                        border: color === c ? '2.5px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: color === c ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Review Platforms */}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Review & Social Links</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {platforms.map(p => {
                    const info = PLATFORMS[p.type] || { name: p.type, icon: '🔗' }
                    return (
                      <div key={p.type} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', width: 24, textAlign: 'center' }}>{info.icon}</span>
                        <input
                          className="form-input"
                          style={{ flex: 1, fontSize: '0.825rem' }}
                          placeholder={`Enter ${info.name} URL...`}
                          value={p.url}
                          onChange={e => updatePlatformUrl(p.type, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removePlatform(p.type)}
                          style={{ color: '#ef4444', padding: '0.4rem 0.6rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}

                  {/* Add Platform Pill Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {Object.entries(PLATFORMS)
                      .filter(([type]) => !platforms.some(p => p.type === type))
                      .map(([type, info]) => (
                        <button
                          key={type}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                          onClick={() => addPlatform(type)}
                        >
                          + {info.icon} {info.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating & Assigning…' : `Save & Assign Card ${cardCode}`}
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: Assign Existing Shop */
          <form onSubmit={handleAssignExisting}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Select Existing Shop to Link</label>
              <select
                className="form-input"
                value={selectedShopId}
                onChange={e => setSelectedShopId(e.target.value)}
                required
              >
                {existingShops.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.platforms?.length || 0} platforms)
                  </option>
                ))}
              </select>
            </div>

            {selectedShopId && (() => {
              const shop = existingShops.find(s => s.id === selectedShopId)
              return (
                <div style={{
                  background: 'var(--bg-glass)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {shop?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {shop?.tagline || 'No tagline'}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)' }}>
                    When customers tap {cardCode}, they will be directed to this shop's review hub.
                  </div>
                </div>
              )
            })()}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Assigning…' : `Assign ${cardCode} to This Shop`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
