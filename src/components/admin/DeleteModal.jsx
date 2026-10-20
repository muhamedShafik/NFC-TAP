export default function DeleteModal({ shop, onConfirm, onClose, deleting }) {
  if (!shop) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !deleting && onClose()}>
      <div className="modal modal-sm" style={{ textAlign: 'center', maxWidth: 420 }}>
        
        {/* Warning Icon Badge */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto 1.25rem'
        }}>
          ⚠️
        </div>

        <h2 className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Delete Shop?
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{shop.name}</strong>?
          This will permanently remove the shop, all associated review links, and tap analytics.
        </p>

        {/* Shop target summary */}
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'left'
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: shop.cover_color || '#6c63ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {(shop.logo || shop.logo_url)
              ? <img src={shop.logo || shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = '🏪' }} />
              : '🏪'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {shop.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              /r/{shop.slug || shop.id}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={deleting}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600
            }}
          >
            {deleting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderRightColor: '#fff' }} />
                Deleting…
              </>
            ) : (
              '🗑 Delete Shop'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
