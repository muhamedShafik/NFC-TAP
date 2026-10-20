import { useState } from 'react'
import { createShop, updateShop, slugify } from '../../lib/api'
import { PLATFORMS, SWATCHES } from '../../lib/platforms.jsx'
import toast from 'react-hot-toast'
import './ShopModal.css'

const PLATFORM_KEYS = Object.keys(PLATFORMS)

export default function ShopModal({ shop, onClose, onSaved }) {
  const isEdit = !!shop
  const [name, setName] = useState(shop?.name || '')
  const [slug, setSlug] = useState(shop?.slug || (shop ? slugify(shop.name) : ''))
  const [customSlug, setCustomSlug] = useState(false)
  const [tagline, setTagline] = useState(shop?.tagline || '')
  const [logo, setLogo] = useState(shop?.logo || '')
  const [color, setColor] = useState(shop?.cover_color || '#6c63ff')
  const [platforms, setPlatforms] = useState(
    shop?.platforms?.map(p => ({ type: p.type, url: p.url })) || []
  )
  const [saving, setSaving] = useState(false)

  function handleNameChange(e) {
    const val = e.target.value
    setName(val)
    if (!customSlug) {
      setSlug(slugify(val))
    }
  }

  function addPlatform(type) {
    if (platforms.find(p => p.type === type)) {
      toast.error(`${PLATFORMS[type]?.name} already added`); return
    }
    setPlatforms(prev => [...prev, { type, url: '' }])
  }

  function removePlatform(i) {
    setPlatforms(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateUrl(i, url) {
    setPlatforms(prev => prev.map((p, idx) => idx === i ? { ...p, url } : p))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Shop name is required'); return }
    setSaving(true)
    try {
      const cleanSlug = (slug || slugify(name.trim())).trim()
      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        tagline: tagline.trim(),
        logo: logo.trim(),
        cover_color: color,
        platforms: platforms.filter(p => p.url.trim()),
      }
      if (isEdit) {
        await updateShop(shop.id, payload)
        toast.success('Shop & review URL updated!')
      } else {
        await createShop(payload)
        toast.success('Shop created!')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save shop')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Shop' : 'Add New Shop'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="modal-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Shop Name *</label>
              <input
                className="form-input"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Brew Coffee House"
                required
              />
              <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span>🔗 Live Review Link:</span>
                <code style={{ background: 'var(--bg-glass)', color: 'var(--accent)', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 600 }}>
                  /r/{slug || slugify(name) || 'shop-name'}
                </code>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input className="form-input" value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="Best Coffee in Town" />
            </div>
            <div className="form-group">
              <label className="form-label">Logo URL</label>
              <input className="form-input" value={logo}
                onChange={e => setLogo(e.target.value)}
                placeholder="https://..." type="url" />
            </div>
          </div>

          {/* Brand Color */}
          <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
            <label className="form-label">Brand Color</label>
            <div className="color-row">
              {SWATCHES.map(c => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input type="color" value={color}
                onChange={e => setColor(e.target.value)}
                className="color-native"
                title="Custom color" />
            </div>
            {/* Preview strip */}
            <div className="color-preview" style={{ background: color }} />
          </div>

          {/* Platform Links */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Review Platforms</label>

            {platforms.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                No platforms added. Add at least one below.
              </p>
            )}

            <div className="platform-list">
              {platforms.map((p, i) => {
                const plat = PLATFORMS[p.type] || PLATFORMS.custom
                return (
                  <div className="platform-row" key={i}>
                    <span className="platform-row-icon">
                      {plat.icon}
                    </span>
                    <input
                      type="url"
                      value={p.url}
                      placeholder={plat.placeholder}
                      onChange={e => updateUrl(i, e.target.value)}
                      className="platform-url-input"
                    />
                    <button type="button" className="platform-remove" onClick={() => removePlatform(i)}>✕</button>
                  </div>
                )
              })}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
              Add platform:
            </p>
            <div className="platform-chips">
              {PLATFORM_KEYS.map(key => {
                const p = PLATFORMS[key]
                const added = platforms.find(pl => pl.type === key)
                return (
                  <button
                    key={key}
                    type="button"
                    className={`platform-chip ${added ? 'chip-added' : ''}`}
                    onClick={() => addPlatform(key)}
                    title={added ? 'Already added' : `Add ${p.name}`}
                  >
                    <span className="chip-icon">{p.icon}</span>
                    {p.name}
                    {added && <span style={{ marginLeft: '0.2rem', opacity: 0.5 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" />{isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? '💾 Save Changes' : '🏪 Create Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
