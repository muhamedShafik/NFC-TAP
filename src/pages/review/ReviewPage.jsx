import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getShopById, trackTap, trackClick } from '../../lib/api'
import { PLATFORMS } from '../../lib/platforms.jsx'
import './ReviewPage.css'

function hexToRgba(hex, alpha) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch { return `rgba(108,99,255,${alpha})` }
}

export default function ReviewPage() {
  const { shopId } = useParams()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getShopById(shopId)
        if (!data || !data.active) { setNotFound(true); return }
        setShop(data)
        trackTap(shopId)   // fire & forget
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    if (shopId) load()
    else setNotFound(true)
  }, [shopId])

  if (loading) return <LoadingScreen />
  if (notFound) return <NotFound />
  return <ReviewContent shop={shop} />
}

function ReviewContent({ shop }) {
  const color = shop.cover_color || '#6c63ff'
  const colorAlpha = hexToRgba(color, 0.22)
  const platforms = (shop.platforms || []).filter(p => p.url)

  function handlePlatformClick(e, platform, url) {
    // Ripple
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    ripple.className = 'ripple-effect'
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)

    // Track
    trackClick(shop.id, platform)
  }

  return (
    <div className="review-page">
      {/* Background */}
      <div className="review-bg">
        <div
          className="review-bg-glow"
          style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${colorAlpha}, transparent 70%)` }}
        />
        <div className="review-bg-dots" />
        <div className="review-orb review-orb-1" style={{ background: color }} />
        <div className="review-orb review-orb-2" style={{ background: color }} />
      </div>

      {/* Content */}
      <div className="review-container">
        {/* Hero */}
        <div className="review-hero">
          <div className="review-logo-wrap">
            <div className="review-logo" style={{ borderColor: hexToRgba(color, 0.3) }}>
              {(shop.logo || shop.logo_url)
                ? <img src={shop.logo || shop.logo_url} alt={shop.name} onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏪' }} />
                : '🏪'}
            </div>
            <div
              className="review-logo-ring"
              style={{ background: `linear-gradient(var(--bg-primary), var(--bg-primary)) padding-box, linear-gradient(135deg, ${color}, ${color}88) border-box` }}
            />
          </div>

          <h1 className="review-shop-name">{shop.name}</h1>
          {shop.tagline && <p className="review-tagline">{shop.tagline}</p>}

          <div className="review-live-badge">
            <span className="live-dot" style={{ background: color }} />
            Tap to leave a review
          </div>
        </div>

        {/* Choose Platform label */}
        <p className="review-cta-label">Choose a platform</p>

        {/* Platform Buttons */}
        <div className="review-platforms">
          {platforms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
              No review platforms configured yet.
            </div>
          ) : platforms.map((p, i) => {
            const plat = PLATFORMS[p.type] || PLATFORMS.custom
            return (
              <a
                key={p.id || i}
                className="platform-btn"
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ '--delay': `${0.3 + i * 0.08}s`, '--btn-grad': plat.gradient }}
                onClick={e => handlePlatformClick(e, p.type, p.url)}
              >
                <div className="platform-btn-icon-wrap">
                  <span className="platform-btn-icon">{plat.icon}</span>
                </div>
                <div className="platform-btn-text">
                  <span className="platform-btn-name">{plat.name}</span>
                  <span className="platform-btn-sub">{plat.sub}</span>
                </div>
                <span className="platform-btn-arrow">→</span>
              </a>
            )
          })}
        </div>

        {/* Footer */}
        <p className="review-footer">
          Powered by <a href="/admin">NFCTap</a> · Review Card System
        </p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="review-page review-loading">
      <div className="review-bg">
        <div className="review-bg-glow" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(108,99,255,0.2), transparent 70%)' }} />
        <div className="review-bg-dots" />
      </div>
      <div className="loading-logo">📲</div>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )
}

function NotFound() {
  return (
    <div className="review-page review-loading">
      <div className="review-bg">
        <div className="review-bg-glow" />
        <div className="review-bg-dots" />
      </div>
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
          This NFC card or QR code is no longer active.
        </p>
      </div>
    </div>
  )
}
