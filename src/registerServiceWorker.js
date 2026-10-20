// Service Worker and PWA Install Manager for Android & iOS

let deferredPrompt = null
let promptListeners = new Set()

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

export function isIOS() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroid() {
  if (typeof window === 'undefined') return false
  return /android/.test(window.navigator.userAgent.toLowerCase())
}

export function getDeferredPrompt() {
  return deferredPrompt
}

export function promptInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    return deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null
      notifyPromptListeners()
      return choiceResult.outcome === 'accepted'
    })
  }
  return Promise.resolve(false)
}

export function subscribePrompt(callback) {
  promptListeners.add(callback)
  return () => promptListeners.delete(callback)
}

function notifyPromptListeners() {
  promptListeners.forEach((cb) => {
    try {
      cb({
        isInstallable: !!deferredPrompt,
        isInstalled: isStandalone(),
        isIOS: isIOS(),
        isAndroid: isAndroid()
      })
    } catch (e) {
      console.error(e)
    }
  })
}

export function registerSW() {
  if (typeof window === 'undefined') {
    return
  }

  // Tag html root with pwa-standalone class if launched as PWA
  if (isStandalone()) {
    document.documentElement.classList.add('pwa-standalone')
  }

  // Lock pinch-to-zoom and multi-touch zoom on iOS and Android
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false })
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false })
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false })

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
      }
    },
    { passive: false }
  )

  if (!('serviceWorker' in navigator)) {
    return
  }

  // Capture the native PWA install banner prompt (Android Chrome, Edge, desktop)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notifyPromptListeners()
  })

  // Detect when app is successfully installed
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyPromptListeners()
    console.log('[PWA] App successfully installed')
  })

  // Register service worker after window load
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] ServiceWorker registered with scope:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available')
              }
            })
          }
        })
      })
      .catch((error) => {
        console.warn('[PWA] ServiceWorker registration failed:', error)
      })
  })
}
