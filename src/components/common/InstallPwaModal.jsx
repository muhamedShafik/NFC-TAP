import { useState, useEffect } from 'react'
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  WifiOff
} from 'lucide-react'
import {
  isStandalone,
  isIOS,
  isAndroid,
  promptInstall,
  subscribePrompt,
  getDeferredPrompt
} from '../../registerServiceWorker'
import './InstallPwaModal.css'

export default function InstallPwaModal({ isOpen, onClose }) {
  const [canPrompt, setCanPrompt] = useState(!!getDeferredPrompt())
  const [alreadyInstalled, setAlreadyInstalled] = useState(isStandalone())
  const [iosDevice] = useState(isIOS())
  const [androidDevice] = useState(isAndroid())
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const unsub = subscribePrompt((state) => {
      setCanPrompt(state.isInstallable)
      setAlreadyInstalled(state.isInstalled)
    })
    return unsub
  }, [])

  if (!isOpen) return null

  async function handleInstallClick() {
    setInstalling(true)
    try {
      const accepted = await promptInstall()
      if (accepted) {
        onClose?.()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pwa-install-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pwa-modal-header">
          <div className="pwa-header-brand">
            <img src="/icons/icon-192.png" alt="NFC Tap Logo" className="pwa-app-icon" />
            <div>
              <h2 className="pwa-modal-title">Install NFC Tap App</h2>
              <p className="pwa-modal-subtitle">Fast, standalone experience for Android & iOS</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {alreadyInstalled ? (
          <div className="pwa-installed-card">
            <CheckCircle2 size={36} className="text-success" />
            <h3>Already Installed!</h3>
            <p>NFC Tap is running in standalone mode on your device.</p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem', width: '100%' }}>
              Got It
            </button>
          </div>
        ) : (
          <div className="pwa-modal-body">
            {/* Feature highlights */}
            <div className="pwa-features-grid">
              <div className="pwa-feature-item">
                <div className="feature-icon"><Zap size={16} /></div>
                <div>
                  <strong>Instant Launch</strong>
                  <span>Opens instantly like a native mobile app</span>
                </div>
              </div>
              <div className="pwa-feature-item">
                <div className="feature-icon"><Smartphone size={16} /></div>
                <div>
                  <strong>Full Screen</strong>
                  <span>No browser address bar or distractions</span>
                </div>
              </div>
              <div className="pwa-feature-item">
                <div className="feature-icon"><WifiOff size={16} /></div>
                <div>
                  <strong>Offline Ready</strong>
                  <span>Core tools cached for spotty connectivity</span>
                </div>
              </div>
            </div>

            {/* Platform Instructions */}
            {iosDevice ? (
              <div className="pwa-platform-card ios-card">
                <div className="platform-card-title">
                  <span className="platform-pill apple-pill">iOS Safari</span>
                  <span>How to install on iPhone or iPad:</span>
                </div>
                <ol className="pwa-steps-list">
                  <li>
                    <span className="step-num">1</span>
                    <span>
                      Tap the <strong>Share</strong> button <Share2 size={15} style={{ verticalAlign: 'middle', display: 'inline', color: '#38bdf8' }} /> in the Safari toolbar (at the bottom or top).
                    </span>
                  </li>
                  <li>
                    <span className="step-num">2</span>
                    <span>
                      Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare size={15} style={{ verticalAlign: 'middle', display: 'inline', color: '#a855f7' }} />.
                    </span>
                  </li>
                  <li>
                    <span className="step-num">3</span>
                    <span>
                      Tap <strong>"Add"</strong> in the top-right corner. The NFC Tap icon will appear on your Home Screen!
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="pwa-platform-card android-card">
                <div className="platform-card-title">
                  <span className="platform-pill android-pill">{androidDevice ? 'Android' : 'Desktop / Mobile'}</span>
                  <span>1-Click Installation</span>
                </div>

                {canPrompt ? (
                  <button
                    className="btn btn-primary pwa-install-btn"
                    onClick={handleInstallClick}
                    disabled={installing}
                  >
                    <Download size={18} />
                    {installing ? 'Opening Install Dialog...' : 'Install NFC Tap Now'}
                  </button>
                ) : (
                  <div className="pwa-steps-list">
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      To install this app directly from your browser:
                    </p>
                    <ol className="pwa-steps-list" style={{ marginTop: '0.5rem' }}>
                      <li>
                        <span className="step-num">1</span>
                        <span>Tap the <strong>three dots menu (⋮)</strong> in your browser's top bar.</span>
                      </li>
                      <li>
                        <span className="step-num">2</span>
                        <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                      </li>
                      <li>
                        <span className="step-num">3</span>
                        <span>Confirm <strong>"Install"</strong> when prompted.</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="pwa-modal-footer">
              <span className="pwa-secure-badge">
                <Sparkles size={13} /> Highly optimized for iOS 15+ & Android 10+
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
