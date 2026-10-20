import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/admin/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import ShopsPage from './pages/admin/ShopsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import BulkQRPage from './pages/admin/BulkQRPage'
import SettingsPage from './pages/admin/SettingsPage'
import ReviewPage from './pages/review/ReviewPage'
import CardRedirectPage from './pages/review/CardRedirectPage'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  return session ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public — Customer Review & Physical Card Tap Routes */}
      <Route path="/r/:shopId" element={<ReviewPage />} />
      <Route path="/c/:code" element={<CardRedirectPage />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/shops" replace />} />
        <Route path="shops" element={<ShopsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="qr-generator" element={<BulkQRPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}
