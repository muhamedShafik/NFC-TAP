import { supabase, supabaseConfigured } from './supabase'

// Initial seed data for demo mode
const INITIAL_DEMO_SHOPS = [
  {
    id: 'bella-coffee-cafe',
    name: 'Bella Coffee & Bakery',
    tagline: 'Artisan hand-crafted coffee, fresh sourdough & desserts',
    logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=160&q=80',
    cover_color: '#f59e0b',
    active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    platforms: [
      { id: 'p1', type: 'google', url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4', sort_order: 0 },
      { id: 'p2', type: 'instagram', url: 'https://instagram.com/bellacoffee', sort_order: 1 },
      { id: 'p3', type: 'facebook', url: 'https://facebook.com/bellacoffee', sort_order: 2 },
      { id: 'p4', type: 'whatsapp', url: 'https://wa.me/15551234567', sort_order: 3 },
    ]
  },
  {
    id: 'apex-fitness-club',
    name: 'Apex Fitness Club',
    tagline: '24/7 Premium Gym, Crossfit Training & Personal Coaching',
    logo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=160&q=80',
    cover_color: '#6c63ff',
    active: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    platforms: [
      { id: 'p5', type: 'google', url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY5', sort_order: 0 },
      { id: 'p6', type: 'instagram', url: 'https://instagram.com/apexfitness', sort_order: 1 },
      { id: 'p7', type: 'whatsapp', url: 'https://wa.me/15559876543', sort_order: 2 },
    ]
  },
  {
    id: 'spice-symphony-bistro',
    name: 'Spice Symphony Bistro',
    tagline: 'Authentic Indian Curry, Tandoori & Craft Cocktails',
    logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=160&q=80',
    cover_color: '#ef4444',
    active: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    platforms: [
      { id: 'p8', type: 'google', url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY6', sort_order: 0 },
      { id: 'p9', type: 'zomato', url: 'https://zomato.com/spicesymphony', sort_order: 1 },
      { id: 'p10', type: 'tripadvisor', url: 'https://tripadvisor.com', sort_order: 2 },
      { id: 'p11', type: 'instagram', url: 'https://instagram.com/spicesymphony', sort_order: 3 },
    ]
  }
]

function getLocalShops() {
  const data = localStorage.getItem('nfc_local_shops')
  if (!data) {
    localStorage.setItem('nfc_local_shops', JSON.stringify(INITIAL_DEMO_SHOPS))
    return INITIAL_DEMO_SHOPS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_DEMO_SHOPS
  }
}

function saveLocalShops(shops) {
  localStorage.setItem('nfc_local_shops', JSON.stringify(shops))
}

function getLocalAnalytics() {
  const data = localStorage.getItem('nfc_local_analytics')
  if (!data) {
    const seed = [
      { shop_id: 'bella-coffee-cafe', event_type: 'tap', created_at: new Date().toISOString() },
      { shop_id: 'bella-coffee-cafe', event_type: 'click', platform: 'google', created_at: new Date().toISOString() },
      { shop_id: 'bella-coffee-cafe', event_type: 'click', platform: 'instagram', created_at: new Date().toISOString() },
      { shop_id: 'apex-fitness-club', event_type: 'tap', created_at: new Date().toISOString() },
      { shop_id: 'apex-fitness-club', event_type: 'click', platform: 'google', created_at: new Date().toISOString() },
    ]
    localStorage.setItem('nfc_local_analytics', JSON.stringify(seed))
    return seed
  }
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLocalAnalytics(analytics) {
  localStorage.setItem('nfc_local_analytics', JSON.stringify(analytics))
}

// ===================== HELPER FUNCTIONS =====================
export function slugify(text) {
  if (!text) return 'shop'
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-')     // Replace spaces, underscores with a single hyphen
    .replace(/^-+|-+$/g, '')      // Trim leading/trailing hyphens
}

export function getShopSlug(shop) {
  if (!shop) return ''
  if (typeof shop === 'string') return slugify(shop)
  return shop.slug || slugify(shop.name) || shop.id
}

// ===================== SHOPS =====================
export async function getRawShops() {
  if (supabaseConfigured) {
    const { data, error } = await supabase
      .from('shops')
      .select('*, platforms(*)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('❌ Supabase getShops failed:', error)
      throw new Error(error.message || 'Failed to load shops from database')
    }
    return (data || []).map(s => ({
      ...s,
      slug: s.slug || slugify(s.name) || s.id
    }))
  }
  return getLocalShops().map(s => ({
    ...s,
    slug: s.slug || slugify(s.name) || s.id
  }))
}

export async function getShops() {
  const shopList = await getRawShops()
  try {
    const cards = await getRawCards()
    return shopList.map(shop => {
      const assignedCard = cards.find(c =>
        c.status === 'assigned' && (
          c.shop_id === shop.id ||
          c.shop_id === shop.slug ||
          (c.shop_name && slugify(c.shop_name) === slugify(shop.name))
        )
      )
      return {
        ...shop,
        card: assignedCard || null,
        card_code: assignedCard ? assignedCard.code : null
      }
    })
  } catch {
    return shopList
  }
}

export async function getShopById(idOrSlug) {
  const cleanKey = (idOrSlug || '').toString().trim().toLowerCase()
  if (!cleanKey) throw new Error('Shop identifier required')

  // 0. Check if cleanKey is a Card Code (e.g. CARD-1001)
  try {
    const cardCode = extractCardCode(idOrSlug)
    if (cardCode && (cardCode.startsWith('CARD-') || cardCode.startsWith('NFC-') || cardCode.startsWith('TAP-'))) {
      const cards = await getRawCards()
      const card = cards.find(c => c.code.toUpperCase() === cardCode)
      if (card && card.status === 'assigned' && card.shop_id) {
        return await getShopById(card.shop_id)
      }
    }
  } catch {}

  if (supabaseConfigured) {
    try {
      // 1. Try finding by ID
      const { data: byId } = await supabase
        .from('shops')
        .select('*, platforms(*)')
        .eq('id', idOrSlug)
        .maybeSingle()

      if (byId) {
        return { ...byId, slug: byId.slug || slugify(byId.name) || byId.id }
      }

      // 2. Try finding by slug column
      const { data: bySlug } = await supabase
        .from('shops')
        .select('*, platforms(*)')
        .eq('slug', cleanKey)
        .maybeSingle()

      if (bySlug) {
        return { ...bySlug, slug: bySlug.slug || slugify(bySlug.name) || bySlug.id }
      }

      // 3. Try finding all and matching slugified name
      const { data: allShops } = await supabase
        .from('shops')
        .select('*, platforms(*)')

      if (allShops) {
        const matched = allShops.find(s => slugify(s.name) === cleanKey || s.slug === cleanKey)
        if (matched) {
          return { ...matched, slug: matched.slug || slugify(matched.name) || matched.id }
        }
      }
    } catch (e) {
      console.warn('Supabase getShopById fallback', e)
    }
  }

  const shops = getLocalShops()
  const shop = shops.find(s => 
    s.id?.toString().toLowerCase() === cleanKey || 
    s.slug?.toString().toLowerCase() === cleanKey || 
    slugify(s.name) === cleanKey
  )
  if (!shop) throw new Error('Shop not found')
  return { ...shop, slug: shop.slug || slugify(shop.name) || shop.id }
}

export async function createShop(shopData) {
  const { platforms, ...rawShop } = shopData
  const cleanSlug = rawShop.slug ? slugify(rawShop.slug) : slugify(rawShop.name)
  const { slug, ...shopWithoutSlug } = rawShop
  const newId = cleanSlug

  if (supabaseConfigured) {
    let newShop = null
    try {
      // Try with slug column
      const res = await supabase
        .from('shops')
        .insert([{ ...rawShop, slug: cleanSlug, active: true }])
        .select()
        .single()
      if (!res.error && res.data) {
        newShop = res.data
      }
    } catch {}

    if (!newShop) {
      // Fallback strictly without slug column if column doesn't exist
      const { data, error } = await supabase
        .from('shops')
        .insert([{ ...shopWithoutSlug, active: true }])
        .select()
        .single()
      if (error) {
        console.error('Supabase createShop error:', error)
        throw new Error(error.message || 'Failed to create shop in database')
      }
      newShop = data
    }

    if (newShop && platforms && platforms.length > 0) {
      const platformRows = platforms.map((p, i) => ({
        shop_id: newShop.id,
        type: p.type,
        url: p.url,
        sort_order: i,
      }))
      const { error: platErr } = await supabase.from('platforms').insert(platformRows)
      if (platErr) {
        console.error('Supabase platforms insert error:', platErr)
      }
    }
    return { ...newShop, slug: cleanSlug }
  }

  // Local fallback (only when Supabase credentials are not provided)
  const created = {
    id: newId,
    slug: cleanSlug,
    ...rawShop,
    active: true,
    created_at: new Date().toISOString(),
    platforms: (platforms || []).map((p, i) => ({
      id: 'p-' + Math.random().toString(36).substring(2, 7),
      shop_id: newId,
      type: p.type,
      url: p.url,
      sort_order: i,
    }))
  }
  const shops = getLocalShops()
  shops.unshift(created)
  saveLocalShops(shops)
  return created
}

export async function updateShop(id, shopData) {
  const { platforms, ...rawShop } = shopData
  const newSlug = shopData.slug ? slugify(shopData.slug) : slugify(shopData.name)
  const { slug, ...shopWithoutSlug } = rawShop

  if (supabaseConfigured) {
    let updated = false
    try {
      // Attempt update with slug
      const { error } = await supabase.from('shops').update({ ...rawShop, slug: newSlug }).eq('id', id)
      if (!error) updated = true
    } catch {}

    if (!updated) {
      // Fallback strictly without slug
      const { error } = await supabase.from('shops').update(shopWithoutSlug).eq('id', id)
      if (error) {
        console.error('Supabase updateShop error:', error)
        throw new Error(error.message || 'Failed to update shop in database')
      }
    }

    if (platforms !== undefined) {
      await supabase.from('platforms').delete().eq('shop_id', id)
      if (platforms.length > 0) {
        const platformRows = platforms.map((p, i) => ({
          shop_id: id,
          type: p.type,
          url: p.url,
          sort_order: i,
        }))
        const { error: platErr } = await supabase.from('platforms').insert(platformRows)
        if (platErr) {
          console.error('Supabase platforms update error:', platErr)
        }
      }
    }
  }

  // Local fallback and synchronizer
  const shops = getLocalShops()
  const idx = shops.findIndex(s => s.id === id || s.slug === id)
  if (idx !== -1) {
    const oldShop = shops[idx]
    const updatedId = newSlug || oldShop.id
    shops[idx] = {
      ...oldShop,
      ...shop,
      id: updatedId,
      slug: newSlug,
      platforms: platforms !== undefined ? platforms.map((p, i) => ({
        id: p.id || 'p-' + Math.random().toString(36).substring(2, 7),
        shop_id: updatedId,
        type: p.type,
        url: p.url,
        sort_order: i,
      })) : oldShop.platforms
    }

    // Update any linked analytics to match new shop slug/id
    const analytics = getLocalAnalytics()
    let analyticsModified = false
    analytics.forEach(a => {
      if (a.shop_id === id) {
        a.shop_id = updatedId
        analyticsModified = true
      }
    })
    if (analyticsModified) {
      saveLocalAnalytics(analytics)
    }

    saveLocalShops(shops)
  }
}

export async function deleteShop(id) {
  if (supabaseConfigured) {
    const { error } = await supabase.from('shops').delete().eq('id', id)
    if (error) {
      console.error('Supabase deleteShop error:', error)
      throw new Error(error.message || 'Failed to delete shop from database')
    }
    return
  }
  const shops = getLocalShops().filter(s => s.id !== id)
  saveLocalShops(shops)
}

export async function toggleShopActive(id, active) {
  if (supabaseConfigured) {
    const { error } = await supabase.from('shops').update({ active }).eq('id', id)
    if (error) {
      console.error('Supabase toggleShopActive error:', error)
      throw new Error(error.message || 'Failed to update shop status in database')
    }
    return
  }
  const shops = getLocalShops()
  const shop = shops.find(s => s.id === id)
  if (shop) {
    shop.active = active
    saveLocalShops(shops)
  }
}

// ===================== ANALYTICS =====================
export async function trackTap(shopId) {
  if (supabaseConfigured) {
    try {
      await supabase.from('analytics').insert([{ shop_id: shopId, event_type: 'tap' }])
      return
    } catch {
      // fallback
    }
  }
  const list = getLocalAnalytics()
  list.push({ shop_id: shopId, event_type: 'tap', created_at: new Date().toISOString() })
  saveLocalAnalytics(list)
}

export async function trackClick(shopId, platform) {
  if (supabaseConfigured) {
    try {
      await supabase.from('analytics').insert([{ shop_id: shopId, event_type: 'click', platform }])
      return
    } catch {
      // fallback
    }
  }
  const list = getLocalAnalytics()
  list.push({ shop_id: shopId, event_type: 'click', platform, created_at: new Date().toISOString() })
  saveLocalAnalytics(list)
}

export async function getShopAnalytics(shopId) {
  let records = []
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('event_type, platform, created_at')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
      if (!error && data) records = data
    } catch (e) {
      console.warn('Supabase analytics fetch failed, using local', e)
    }
  }

  if (records.length === 0) {
    records = getLocalAnalytics().filter(r => r.shop_id === shopId)
  }

  const taps = records.filter(r => r.event_type === 'tap').length
  const clicks = {}
  records.filter(r => r.event_type === 'click').forEach(r => {
    clicks[r.platform] = (clicks[r.platform] || 0) + 1
  })

  const dates = {}
  records.filter(r => r.event_type === 'tap').forEach(r => {
    const d = (r.created_at || '').slice(0, 10)
    if (d) dates[d] = (dates[d] || 0) + 1
  })

  return { taps, clicks, dates }
}

export async function getAllAnalytics() {
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase.from('analytics').select('*')
      if (!error && data) return data
    } catch {
      // fallback
    }
  }
  return getLocalAnalytics()
}

// ===================== ADMIN AUTH =====================
const MASTER_EMAIL = 'muhammedshafik9544@gmail.com'
const MASTER_PASS = 'Shafi9037135820'

export async function adminSignIn(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPass = (password || '').trim()

  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      })
      if (!error && data?.session) {
        localStorage.setItem('nfc_admin_session', cleanEmail)
        return data
      }
      if (error && !error.message?.toLowerCase().includes('confirm') && cleanEmail !== MASTER_EMAIL) {
        throw new Error(error.message || 'Invalid login credentials')
      }
    } catch (err) {
      if (cleanEmail !== MASTER_EMAIL || cleanPass !== MASTER_PASS) {
        throw err
      }
    }
  }

  // Verify master admin credentials
  if (cleanEmail === MASTER_EMAIL && cleanPass === MASTER_PASS) {
    localStorage.setItem('nfc_admin_session', cleanEmail)
    return { user: { email: cleanEmail, id: 'admin' } }
  }

  throw new Error('Invalid email or password')
}

export async function adminSignOut() {
  localStorage.removeItem('nfc_admin_session')
  localStorage.removeItem('nfc_demo_session')
  if (supabaseConfigured) {
    try {
      await supabase.auth.signOut()
    } catch {}
  }
}

export async function getSession() {
  const savedAdmin = localStorage.getItem('nfc_admin_session')
  if (savedAdmin) {
    return { user: { email: savedAdmin, id: 'admin' } }
  }
  if (supabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch {
      return null
    }
  }
  return null
}

export async function sendForgotPasswordEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) throw new Error('Please enter your email address')

  try {
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send reset email')
    }

    if (supabaseConfigured) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/admin/login`
        })
      } catch {}
    }

    return data
  } catch (err) {
    if (supabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/admin/login`
      })
      if (!error) {
        return { success: true, message: 'Password reset link sent to your email' }
      }
    }
    throw err
  }
}

export async function verifyResetCodeAndSetPassword(email, code, newPassword) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail || !code || !newPassword) {
    throw new Error('Email, verification code, and new password are required')
  }

  const res = await fetch('/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, code: code.trim(), newPassword })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset password')
  }

  if (supabaseConfigured) {
    try {
      await supabase.auth.updateUser({ password: newPassword })
    } catch {}
  }

  return data
}

// ===================== NFC & QR CARDS =====================
const INITIAL_DEMO_CARDS = [
  { id: 'card-1001', code: 'CARD-1001', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1002', code: 'CARD-1002', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1003', code: 'CARD-1003', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1004', code: 'CARD-1004', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1005', code: 'CARD-1005', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1006', code: 'CARD-1006', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1007', code: 'CARD-1007', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
  { id: 'card-1008', code: 'CARD-1008', batch_name: 'Batch 1 (Starter)', status: 'unassigned', shop_id: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), assigned_at: null },
]

export function extractCardCode(input) {
  if (!input) return ''
  let text = input.toString().trim()
  // If input is a URL like http://.../c/CARD-1001 or /c/CARD-1001
  const urlMatch = text.match(/\/c\/([a-zA-Z0-9_-]+)/i)
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase()
  }
  // If it's a URL like http://.../r/bella-supreme-cafe
  const rMatch = text.match(/\/r\/([a-zA-Z0-9_-]+)/i)
  if (rMatch && rMatch[1]) {
    return rMatch[1].toUpperCase()
  }
  return text.replace(/[^\w-]/g, '').toUpperCase()
}

export function getCardUrl(code) {
  const cleanCode = extractCardCode(code)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/c/${cleanCode}`
}

export function getLocalCards() {
  const data = localStorage.getItem('nfc_local_cards')
  if (!data) {
    localStorage.setItem('nfc_local_cards', JSON.stringify(INITIAL_DEMO_CARDS))
    return INITIAL_DEMO_CARDS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_DEMO_CARDS
  }
}

export function saveLocalCards(cards) {
  localStorage.setItem('nfc_local_cards', JSON.stringify(cards))
}

export async function isCardsTableAvailable() {
  if (!supabaseConfigured) return false
  try {
    const { error } = await supabase.from('cards').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

export async function getRawCards() {
  let cards = []
  let tableAvailable = false

  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data !== null) {
        tableAvailable = true
        cards = data
      }
    } catch {}
  }

  if (tableAvailable) {
    // If Supabase table is empty, auto-seed local cards into Supabase so all devices have them
    const local = getLocalCards()
    const localAssigned = local.filter(c => c.status === 'assigned')

    if (cards.length === 0 && local.length > 0) {
      try {
        await supabase.from('cards').insert(local)
        cards = local
      } catch (err) {
        console.warn('Auto-seed cards to Supabase failed:', err)
      }
    } else if (localAssigned.length > 0) {
      // If this device (e.g. phone) has assigned cards locally that are not yet in Supabase, sync them!
      let needsRefetch = false
      for (const lc of localAssigned) {
        const inDb = cards.find(c => c.code.toUpperCase() === lc.code.toUpperCase())
        if (!inDb || inDb.status !== 'assigned') {
          try {
            await supabase.from('cards').upsert({
              id: lc.id || 'card-' + lc.code.toLowerCase(),
              code: lc.code.toUpperCase(),
              batch_name: lc.batch_name || 'Batch 1 (Starter)',
              status: 'assigned',
              shop_id: lc.shop_id,
              created_at: lc.created_at || new Date().toISOString(),
              assigned_at: lc.assigned_at || new Date().toISOString()
            })
            needsRefetch = true
          } catch {}
        }
      }
      if (needsRefetch) {
        try {
          const { data } = await supabase.from('cards').select('*').order('created_at', { ascending: false })
          if (data && data.length > 0) cards = data
        } catch {}
      }
    }
  } else {
    // Fallback when Supabase table does not exist
    cards = getLocalCards()
  }

  return cards
}

export async function getCards() {
  const cards = await getRawCards()

  // Enrich with shop information (using getRawShops to prevent recursion)
  try {
    const shops = await getRawShops()
    const shopMap = new Map(shops.map(s => [s.id, s]))
    return cards.map(c => {
      const matchedShop = c.shop_id ? (shopMap.get(c.shop_id) || shops.find(s => s.slug === c.shop_id || slugify(s.name) === c.shop_id)) : null
      return {
        ...c,
        shop: matchedShop || null,
        shop_name: matchedShop ? matchedShop.name : (c.shop_name || null)
      }
    })
  } catch {
    return cards
  }
}

export async function getCardByCode(rawCode) {
  const code = extractCardCode(rawCode)
  if (!code) throw new Error('Invalid card code')

  let card = null
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .ilike('code', code)
        .maybeSingle()
      if (!error && data) {
        card = data
      }
    } catch {}
  }

  if (!card) {
    const local = getLocalCards()
    card = local.find(c => c.code.toUpperCase() === code) || null
  }

  if (!card) return null

  // If assigned, enrich with shop
  if (card.shop_id) {
    try {
      const shop = await getShopById(card.shop_id)
      card.shop = shop
      card.shop_name = shop.name
    } catch {}
  }

  return card
}

export async function createBulkCards({ quantity = 10, prefix = 'CARD-', startNumber, batchName }) {
  const existing = await getCards()
  const cleanPrefix = (prefix || 'CARD-').toUpperCase().trim()
  
  // Calculate starting number if not provided
  let start = parseInt(startNumber, 10)
  if (isNaN(start) || start <= 0) {
    const numbers = existing
      .map(c => {
        const m = c.code.match(new RegExp(`^${cleanPrefix.replace('-', '\\-')}(\\d+)`, 'i'))
        return m ? parseInt(m[1], 10) : 0
      })
      .filter(n => !isNaN(n) && n > 0)
    start = numbers.length ? Math.max(...numbers) + 1 : 1001
  }

  const cleanBatchName = batchName?.trim() || `Batch ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const newCards = []
  const now = new Date().toISOString()

  for (let i = 0; i < quantity; i++) {
    const num = start + i
    const code = `${cleanPrefix}${num}`
    newCards.push({
      id: 'card-' + code.toLowerCase(),
      code,
      batch_name: cleanBatchName,
      status: 'unassigned',
      shop_id: null,
      created_at: now,
      assigned_at: null
    })
  }

  // Attempt Supabase insert if table exists
  if (supabaseConfigured) {
    try {
      const { error } = await supabase.from('cards').insert(newCards)
      if (!error) {
        const local = getLocalCards()
        saveLocalCards([...newCards, ...local])
        return newCards
      }
    } catch {}
  }

  // Local fallback
  const local = getLocalCards()
  const updated = [...newCards, ...local]
  saveLocalCards(updated)
  return newCards
}

export async function assignCardToShop(rawCode, shopId) {
  const code = extractCardCode(rawCode)
  if (!code) throw new Error('Card code required')
  if (!shopId) throw new Error('Shop selection required')

  const now = new Date().toISOString()

  if (supabaseConfigured) {
    try {
      // Try upsert to ensure card is created in Supabase even if it was pre-existing only in local storage
      await supabase
        .from('cards')
        .upsert({
          id: 'card-' + code.toLowerCase(),
          code: code.toUpperCase(),
          batch_name: 'Batch 1 (Starter)',
          status: 'assigned',
          shop_id: shopId,
          assigned_at: now
        })
    } catch (err) {
      console.warn('Supabase assignCardToShop failed:', err)
    }
  }

  // Update local
  const local = getLocalCards()
  const idx = local.findIndex(c => c.code.toUpperCase() === code)
  if (idx !== -1) {
    local[idx] = {
      ...local[idx],
      status: 'assigned',
      shop_id: shopId,
      assigned_at: now
    }
  } else {
    // If card was entered on the fly
    local.unshift({
      id: 'card-' + code.toLowerCase(),
      code,
      batch_name: 'Custom Assigned',
      status: 'assigned',
      shop_id: shopId,
      created_at: now,
      assigned_at: now
    })
  }
  saveLocalCards(local)
  return true
}

export async function unassignCard(rawCode) {
  const code = extractCardCode(rawCode)
  if (!code) throw new Error('Card code required')

  if (supabaseConfigured) {
    try {
      await supabase
        .from('cards')
        .update({ status: 'unassigned', shop_id: null, assigned_at: null })
        .ilike('code', code)
    } catch {}
  }

  const local = getLocalCards()
  const idx = local.findIndex(c => c.code.toUpperCase() === code)
  if (idx !== -1) {
    local[idx] = {
      ...local[idx],
      status: 'unassigned',
      shop_id: null,
      assigned_at: null
    }
    saveLocalCards(local)
  }
  return true
}

export async function deleteCard(rawCode) {
  const code = extractCardCode(rawCode)
  if (!code) throw new Error('Card code required')

  if (supabaseConfigured) {
    try {
      await supabase.from('cards').delete().ilike('code', code)
    } catch {}
  }

  const local = getLocalCards().filter(c => c.code.toUpperCase() !== code)
  saveLocalCards(local)
  return true
}
