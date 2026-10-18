import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { adminSignOut } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import './AdminLayout.css'

const NAV = [
  { to: '/admin/shops',        icon: '🏪', label: 'Shops' },
  { to: '/admin/analytics',    icon: '📊', label: 'Analytics' },
  { to: '/admin/qr-generator', icon: '🔳', label: 'Bulk QR' },
  { to: '/admin/settings',     icon: '⚙️', label: 'Settings' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { demoSignOut } = useAuth()

  async function handleLogout() {
    demoSignOut?.()
    await adminSignOut()
    toast.success('Signed out')
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">📲</div>
          <span className="logo-text">NFC<span>Tap</span></span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main</span>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="nav-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">

        {/* Mobile top bar */}
        <header className="admin-topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="topbar-logo">NFC<span>Tap</span></span>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
