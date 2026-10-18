import { useState, useEffect } from 'react'
import { getShops, getShopAnalytics } from '../../lib/api'
import { PLATFORMS } from '../../lib/platforms.jsx'
import toast from 'react-hot-toast'
import './AnalyticsPage.css'

export default function AnalyticsPage() {
  const [shops, setShops] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getShops()
      setShops(data)
      const a = {}
      await Promise.all(data.map(async s => {
        a[s.id] = await getShopAnalytics(s.id)
      }))
      setAnalytics(a)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const totalTaps = Object.values(analytics).reduce((s, a) => s + (a.taps || 0), 0)
  const totalClicks = Object.values(analytics).reduce((s, a) =>
    s + Object.values(a.clicks || {}).reduce((cs, v) => cs + v, 0), 0)
  const convRate = totalTaps ? ((totalClicks / totalTaps) * 100).toFixed(0) : 0

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Track taps and platform clicks across all shops</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↺ Refresh</button>
      </div>

      {/* Global Stats */}
      <div className="stats-grid">
        {[
          { icon: '🏪', label: 'Shops', value: shops.length },
          { icon: '👆', label: 'Total Taps', value: totalTaps },
          { icon: '🔗', label: 'Total Clicks', value: totalClicks },
          { icon: '📈', label: 'Conversion', value: `${convRate}%` },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-Shop Breakdown */}
      {shops.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No data yet</h3>
          <p>Analytics appear after customers tap your NFC cards.</p>
        </div>
      ) : (
        <div className="analytics-list">
          {shops.map(shop => {
            const a = analytics[shop.id] || { taps: 0, clicks: {} }
            const clicks = Object.values(a.clicks || {}).reduce((s, v) => s + v, 0)
            const maxClicks = Math.max(...Object.values(a.clicks || { _: 1 }), 1)
            const platformEntries = Object.entries(a.clicks || {}).sort(([, a], [, b]) => b - a)

            return (
              <div className="analytics-card card" key={shop.id}>
                <div className="analytics-card-header">
                  <div className="analytics-shop-dot" style={{ background: shop.cover_color || 'var(--accent)' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{shop.name}</div>
                    {shop.tagline && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{shop.tagline}</div>}
                  </div>
                  <div className="analytics-mini-stats">
                    <div className="mini-stat">
                      <span className="mini-val">{a.taps}</span>
                      <span className="mini-label">Taps</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-val">{clicks}</span>
                      <span className="mini-label">Clicks</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-val">{a.taps ? Math.round(clicks / a.taps * 100) : 0}%</span>
                      <span className="mini-label">Conv.</span>
                    </div>
                  </div>
                </div>

                {platformEntries.length > 0 ? (
                  <div className="platform-bars">
                    {platformEntries.map(([type, count]) => {
                      const p = PLATFORMS[type] || PLATFORMS.custom
                      const pct = (count / maxClicks * 100).toFixed(0)
                      return (
                        <div className="platform-bar-row" key={type}>
                          <span className="platform-bar-icon">{p.icon}</span>
                          <span className="platform-bar-name">{p.name}</span>
                          <div className="platform-bar-track">
                            <div
                              className="platform-bar-fill"
                              style={{ width: `${pct}%`, background: p.color || 'var(--accent)' }}
                            />
                          </div>
                          <span className="platform-bar-count">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    No platform clicks yet.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
