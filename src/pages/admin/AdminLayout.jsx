import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { adminSignOut } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import ScanCardModal from '../../components/admin/ScanCardModal'
import AssignCardModal from '../../components/admin/AssignCardModal'
import InstallPwaModal from '../../components/common/InstallPwaModal'
import { Camera, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminLayout.css'

const NAV = [
  { to: '/admin/shops',        icon: '🏪', label: 'Shops' },
  { to: '/admin/qr-generator', icon: '🔳', label: 'QR & Cards' },
  { to: '/admin/analytics',    icon: '📊', label: 'Analytics' },
  { to: '/admin/settings',     icon: '⚙️', label: 'Settings' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [assignModal, setAssignModal] = useState({ open: false, code: '' })
  const [pwaModalOpen, setPwaModalOpen] = useState(false)
  const navigate = useNavigate()
  const { demoSignOut } = useAuth()

  async function handleLogout() {
    demoSignOut?.()
    await adminSignOut()
    toast.success('Signed out')
    navigate('/admin/login')
  }

  function handleCardDetected(code) {
    setScanModalOpen(false)
    setAssignModal({ open: true, code })
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

        {/* Quick Scan Action */}
        <div style={{ padding: '0 0.85rem 1rem 0.85rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setScanModalOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              padding: '0.65rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 0 16px rgba(99,102,241,0.35)'
            }}
          >
            <Camera size={16} /> Scan Card to Assign
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main Navigation</span>
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
          <button
            className="nav-item"
            onClick={() => setPwaModalOpen(true)}
            style={{ width: '100%', color: '#818cf8', marginBottom: '0.25rem', fontWeight: 600 }}
          >
            <span className="nav-icon">📲</span>
            Install App
          </button>
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

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPwaModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
              title="Install Web App on your phone"
            >
              <Smartphone size={14} /> App
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setScanModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
            >
              <Camera size={14} /> Scan
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {/* PWA Install Modal */}
      {pwaModalOpen && (
        <InstallPwaModal
          isOpen={pwaModalOpen}
          onClose={() => setPwaModalOpen(false)}
        />
      )}

      {/* Universal Scanner Modal */}
      {scanModalOpen && (
        <ScanCardModal
          isOpen={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          onCardDetected={handleCardDetected}
        />
      )}

      {/* Universal Assign Modal */}
      {assignModal.open && (
        <AssignCardModal
          cardCode={assignModal.code}
          isOpen={assignModal.open}
          onClose={() => setAssignModal({ open: false, code: '' })}
          onAssigned={() => {
            // Trigger refresh if currently on shops or qr page
            navigate(0)
          }}
        />
      )}
    </div>
  )
}
