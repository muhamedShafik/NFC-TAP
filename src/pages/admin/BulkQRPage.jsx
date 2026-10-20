import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  getCards,
  createBulkCards,
  unassignCard,
  deleteCard,
  getCardUrl,
  isCardsTableAvailable
} from '../../lib/api'
import ScanCardModal from '../../components/admin/ScanCardModal'
import AssignCardModal from '../../components/admin/AssignCardModal'
import {
  CreditCard,
  Camera,
  Plus,
  Printer,
  Download,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

export default function BulkQRPage() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unassigned' | 'assigned'
  const [search, setSearch] = useState('')

  // Modals state
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [assignModal, setAssignModal] = useState({ open: false, code: '' })
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  // Batch generation form state
  const [batchQty, setBatchQty] = useState(20)
  const [batchPrefix, setBatchPrefix] = useState('CARD-')
  const [batchStartNum, setBatchStartNum] = useState('')
  const [batchName, setBatchName] = useState('')
  const [generating, setGenerating] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const qrGridRef = useRef(null)

  const [cardsTableReady, setCardsTableReady] = useState(true)
  const [copiedSql, setCopiedSql] = useState(false)

  const cardsSql = `CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  batch_name TEXT DEFAULT 'Batch 1',
  status TEXT DEFAULT 'unassigned',
  shop_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ
);
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;`

  function copyCardsSql() {
    navigator.clipboard.writeText(cardsSql)
    setCopiedSql(true)
    toast.success('SQL copied! Paste in Supabase SQL Editor and run.')
    setTimeout(() => setCopiedSql(false), 3000)
  }

  // Load cards
  async function loadCards() {
    setLoading(true)
    try {
      const ready = await isCardsTableAvailable()
      setCardsTableReady(ready)
      const data = await getCards()
      setCards(data)
    } catch {
      toast.error('Failed to load card inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [])

  // Listen to ?assign=CODE in URL query string
  useEffect(() => {
    const assignCode = searchParams.get('assign')
    if (assignCode) {
      setAssignModal({ open: true, code: assignCode.toUpperCase() })
      // Clear parameter after opening
      searchParams.delete('assign')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Summary counts
  const totalCards = cards.length
  const assignedCards = cards.filter(c => c.status === 'assigned').length
  const unassignedCards = totalCards - assignedCards
  const allAssigned = totalCards > 0 && unassignedCards === 0

  // Filtered cards
  const filteredCards = cards.filter(c => {
    if (filter === 'unassigned' && c.status !== 'unassigned') return false
    if (filter === 'assigned' && c.status !== 'assigned') return false
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matchCode = c.code.toLowerCase().includes(q)
      const matchShop = c.shop_name?.toLowerCase().includes(q)
      const matchBatch = c.batch_name?.toLowerCase().includes(q)
      return matchCode || matchShop || matchBatch
    }
    return true
  })

  // Handle scanned card detection
  function handleCardDetected(code) {
    setScanModalOpen(false)
    setAssignModal({ open: true, code })
  }

  // Handle batch generation
  async function handleGenerateBatch(e) {
    e.preventDefault()
    setGenerating(true)
    try {
      const created = await createBulkCards({
        quantity: Number(batchQty),
        prefix: batchPrefix,
        startNumber: batchStartNum ? Number(batchStartNum) : undefined,
        batchName: batchName.trim() || undefined
      })
      toast.success(`Generated ${created.length} new cards!`, { icon: '✨' })
      setBatchModalOpen(false)
      setBatchName('')
      setBatchStartNum('')
      await loadCards()
    } catch (err) {
      toast.error(err.message || 'Failed to generate bulk cards')
    } finally {
      setGenerating(false)
    }
  }

  // Handle unassigning a card (toast notification without prompt)
  async function handleUnassign(code) {
    try {
      await unassignCard(code)
      toast.success(`Card ${code} unassigned and available again!`, {
        icon: '🔄',
        duration: 3500,
        style: {
          borderRadius: '10px',
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      })
      await loadCards()
    } catch {
      toast.error('Failed to unassign card')
    }
  }

  // Handle reassigning a card with SweetAlert confirmation
  async function handleReassignClick(card) {
    const result = await Swal.fire({
      title: 'Reassign Card?',
      html: `Card <b style="color:#818cf8; font-family:monospace;">${card.code}</b> is currently linked to <b>${card.shop_name || 'a shop'}</b>.<br/><br/><span style="color:#94a3b8; font-size:0.875rem;">Would you like to assign this card to another shop?</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reassign',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#334155'
    })

    if (result.isConfirmed) {
      setAssignModal({ open: true, code: card.code })
    }
  }

  // Handle deleting a card
  async function handleDelete(code) {
    if (!window.confirm(`Delete card ${code} completely?`)) return
    try {
      await deleteCard(code)
      toast.success(`Card ${code} deleted`)
      await loadCards()
    } catch {
      toast.error('Failed to delete card')
    }
  }

  // Copy target URL
  function copyCardUrl(code) {
    const url = getCardUrl(code)
    navigator.clipboard.writeText(url)
    toast.success(`Copied: ${url}`)
  }

  // Download All as ZIP
  async function downloadAllZip() {
    const { default: JSZip } = await import('jszip')
    const { saveAs } = await import('file-saver')
    const zip = new JSZip()

    const cardElements = qrGridRef.current?.querySelectorAll('[data-cardcode]')
    if (!cardElements?.length) {
      toast.error('No QR codes available to download')
      return
    }

    toast('Preparing ZIP file…', { icon: '⏳' })

    const promises = [...cardElements].map(el => {
      return new Promise(resolve => {
        const code = el.dataset.cardcode
        const canvas = el.querySelector('canvas')
        if (canvas) {
          canvas.toBlob(blob => {
            zip.file(`${code}-qr.png`, blob)
            resolve()
          })
        } else {
          resolve()
        }
      })
    })

    await Promise.all(promises)
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `nfc-batch-qr-codes.zip`)
    toast.success('Downloaded all QR codes as ZIP!')
  }

  // Download single QR
  function downloadSingle(code, canvas) {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${code}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // Print all visible cards
  function printCards() {
    window.print()
  }

  return (
    <div className="cards-management-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>QR & NFC Card Manager</h1>
          <p>Pre-generate printable batches, scan on-site, and assign instantly to shops</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setScanModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}
          >
            <Camera size={18} /> Scan QR to Assign
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setBatchModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Plus size={18} /> Generate Batch
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={downloadAllZip}
            disabled={cards.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={16} /> Download ZIP
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={printCards}
            disabled={cards.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Printer size={16} /> Print Sheet
          </button>
        </div>
      </div>

      {/* Cloud Sync Warning Banner */}
      {!cardsTableReady && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#f59e0b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Phone & Laptop Multi-Device Sync Notice
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                The <code>cards</code> table has not been created in Supabase yet. Cards assigned on your phone are currently stored only in your phone's browser memory. Run this quick SQL in your Supabase SQL Editor so both your phone and laptop sync live!
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={copyCardsSql}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              {copiedSql ? <Check size={14} /> : <Copy size={14} />}
              {copiedSql ? 'Copied SQL!' : 'Copy Supabase SQL'}
            </button>
          </div>
          <pre style={{
            margin: 0,
            padding: '0.65rem 0.85rem',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 6,
            fontSize: '0.76rem',
            fontFamily: 'monospace',
            color: '#38bdf8',
            overflowX: 'auto',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
{cardsSql}
          </pre>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Printed Cards</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCards}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>In inventory batch pool</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Available (Unassigned)</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b' }}>{unassignedCards}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ready to take to new shops</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Assigned to Shops</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981' }}>{assignedCards}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Live customer review cards</div>
        </div>
      </div>

      {/* Congratulatory / Next Batch Banner */}
      {allAssigned && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.15))',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
              <Sparkles size={18} /> All Cards in Current Batch Assigned!
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Every physical QR card in your inventory is now assigned to a shop. Generate another batch of QR codes to continue onboarding businesses.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setBatchModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Plus size={16} /> Generate Next Batch
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            All Cards ({totalCards})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'unassigned' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('unassigned')}
            style={{ color: filter !== 'unassigned' ? '#f59e0b' : undefined }}
          >
            Available ({unassignedCards})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'assigned' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('assigned')}
            style={{ color: filter !== 'assigned' ? '#10b981' : undefined }}
          >
            Assigned ({assignedCards})
          </button>
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Search by CARD-ID or Shop Name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300, fontSize: '0.85rem' }}
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔳</div>
          <h3>No cards match your filter</h3>
          <p>
            {totalCards === 0
              ? 'Generate your first batch of printable QR codes to start distributing to shops.'
              : 'Try changing your search term or filter selection.'}
          </p>
          {totalCards === 0 && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setBatchModalOpen(true)}
            >
              <Plus size={16} /> Generate First Batch
            </button>
          )}
        </div>
      ) : (
        <div
          ref={qrGridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredCards.map(card => {
            const isAssigned = card.status === 'assigned'
            const targetUrl = getCardUrl(card.code)

            return (
              <div
                key={card.code}
                data-cardcode={card.code}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isAssigned ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.25)',
                  background: isAssigned ? 'rgba(16,185,129,0.02)' : 'rgba(245,158,11,0.02)'
                }}
              >
                {/* Header status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.04em'
                  }}>
                    {card.code}
                  </span>
                  <span className="badge" style={{
                    fontSize: '0.7rem',
                    background: isAssigned ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: isAssigned ? '#10b981' : '#f59e0b',
                    border: `1px solid ${isAssigned ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                  }}>
                    {isAssigned ? '🟢 Assigned' : '🟡 Available'}
                  </span>
                </div>

                {/* QR Code Frame */}
                <div style={{
                  background: '#ffffff',
                  padding: '0.85rem',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '0.85rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <QRCodeCanvas
                    value={targetUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Target URL */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-glass)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 6,
                  fontSize: '0.725rem',
                  marginBottom: '0.75rem',
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    /c/{card.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCardUrl(card.code)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    title="Copy Target Link"
                  >
                    <Copy size={13} />
                  </button>
                </div>

                {/* Assigned Shop info */}
                <div style={{ flex: 1, marginBottom: '0.85rem' }}>
                  {isAssigned ? (
                    <div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Linked Shop:</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {card.shop_name || card.shop?.name || card.shop_id}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Ready to take on-site and assign to a business
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {isAssigned ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        onClick={() => window.open(targetUrl, '_blank')}
                      >
                        <ExternalLink size={13} /> Test Link
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleReassignClick(card)}
                        title="Reassign to another shop"
                      >
                        Reassign
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', fontSize: '0.75rem' }}
                        onClick={() => handleUnassign(card.code)}
                        title="Unassign this card"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      onClick={() => setAssignModal({ open: true, code: card.code })}
                    >
                      ⚡ Assign to Shop
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Batch Generator Modal */}
      {batchModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setBatchModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="var(--accent)" /> Generate Bulk QR Codes
              </h2>
              <button className="modal-close" onClick={() => setBatchModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleGenerateBatch}>
              <div className="modal-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Batch Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Batch #2 (50 Standees)"
                    value={batchName}
                    onChange={e => setBatchName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <select
                    className="form-input"
                    value={batchQty}
                    onChange={e => setBatchQty(Number(e.target.value))}
                  >
                    <option value={10}>10 Cards</option>
                    <option value={20}>20 Cards</option>
                    <option value={50}>50 Cards</option>
                    <option value={100}>100 Cards</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Code Prefix</label>
                  <input
                    className="form-input"
                    value={batchPrefix}
                    onChange={e => setBatchPrefix(e.target.value.toUpperCase())}
                    placeholder="CARD-"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Starting Number (Optional)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Auto-calculated from highest number"
                    value={batchStartNum}
                    onChange={e => setBatchStartNum(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setBatchModalOpen(false)}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? 'Generating…' : `Generate ${batchQty} QR Codes`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Card Modal */}
      {scanModalOpen && (
        <ScanCardModal
          isOpen={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          onCardDetected={handleCardDetected}
        />
      )}

      {/* Assign Card Modal */}
      {assignModal.open && (
        <AssignCardModal
          cardCode={assignModal.code}
          isOpen={assignModal.open}
          onClose={() => setAssignModal({ open: false, code: '' })}
          onAssigned={() => loadCards()}
        />
      )}
    </div>
  )
}
