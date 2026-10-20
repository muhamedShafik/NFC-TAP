import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCardByCode, extractCardCode } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { CreditCard, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import ReviewPage from './ReviewPage'

export default function CardRedirectPage() {
  const { code: rawCode } = useParams()
  const code = extractCardCode(rawCode)
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function resolveCard() {
      if (!code) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const found = await getCardByCode(code)
        if (!found) {
          setNotFound(true)
        } else {
          setCard(found)
          // If assigned and shop is active, redirect to the shop review page URL
          if (found.status === 'assigned' && found.shop_id) {
            const target = found.shop?.slug || found.shop_id
            navigate(`/r/${target}`, { replace: true })
            return
          }
        }
      } catch (err) {
        console.error('Error resolving card:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    resolveCard()
  }, [code, navigate])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#fff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div className="spinner" style={{ width: 36, height: 36, marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>Connecting to Card {code}…</p>
      </div>
    )
  }

  // If card is unassigned:
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 70%)',
      padding: '1.5rem',
      fontFamily: 'Inter, sans-serif',
      color: '#fff'
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto'
        }}>
          <CreditCard size={32} color="#818cf8" />
        </div>

        <div style={{
          display: 'inline-block',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 20,
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem'
        }}>
          ⚡ Unassigned Card
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          {code}
        </h1>

        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
          This pre-printed physical NFC / QR standee has not been linked to a business profile yet.
        </p>

        {session ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => navigate(`/admin/qr-generator?assign=${code}`)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: '0.925rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Assign This Card to a Shop <ArrowRight size={18} />
            </button>
            <Link
              to="/admin/shops"
              style={{
                color: '#94a3b8',
                fontSize: '0.825rem',
                textDecoration: 'none',
                marginTop: '0.25rem'
              }}
            >
              Back to Admin Dashboard
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to={`/admin/login?redirect=${encodeURIComponent(`/admin/qr-generator?assign=${code}`)}`}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                borderRadius: 12,
                fontSize: '0.925rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxSizing: 'border-box'
              }}
            >
              Admin Sign In to Activate <ArrowRight size={18} />
            </Link>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Only authorized staff can assign new NFC cards
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
