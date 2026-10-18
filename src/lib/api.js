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

// ===================== SHOPS =====================
export async function getShops() {
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*, platforms(*)')
        .order('created_at', { ascending: false })
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase getShops failed, fallback to local', e)
    }
  }
  return getLocalShops()
}

export async function getShopById(id) {
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*, platforms(*)')
        .eq('id', id)
        .single()
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase getShopById failed, fallback to local', e)
    }
  }
  const shops = getLocalShops()
  const shop = shops.find(s => s.id === id)
  if (!shop) throw new Error('Shop not found')
  return shop
}

export async function createShop(shopData) {
  const { platforms, ...shop } = shopData
  const newId = (shop.name || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7)

  if (supabaseConfigured) {
    try {
      const { data: newShop, error } = await supabase
        .from('shops')
        .insert([{ ...shop, active: true }])
        .select()
        .single()
      if (!error && newShop) {
        if (platforms && platforms.length > 0) {
          const platformRows = platforms.map((p, i) => ({
            shop_id: newShop.id,
            type: p.type,
            url: p.url,
            sort_order: i,
          }))
          await supabase.from('platforms').insert(platformRows)
        }
        return newShop
      }
    } catch (e) {
      console.warn('Supabase createShop failed, saving locally', e)
    }
  }

  // Local fallback
  const created = {
    id: newId,
    ...shop,
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
  const { platforms, ...shop } = shopData

  if (supabaseConfigured) {
    try {
      const { error } = await supabase.from('shops').update(shop).eq('id', id)
      if (!error) {
        if (platforms !== undefined) {
          await supabase.from('platforms').delete().eq('shop_id', id)
          if (platforms.length > 0) {
            const platformRows = platforms.map((p, i) => ({
              shop_id: id,
              type: p.type,
              url: p.url,
              sort_order: i,
            }))
            await supabase.from('platforms').insert(platformRows)
          }
        }
        return
      }
    } catch (e) {
      console.warn('Supabase updateShop failed, fallback to local', e)
    }
  }

  // Local fallback
  const shops = getLocalShops()
  const idx = shops.findIndex(s => s.id === id)
  if (idx !== -1) {
    shops[idx] = {
      ...shops[idx],
      ...shop,
      platforms: platforms !== undefined ? platforms.map((p, i) => ({
        id: p.id || 'p-' + Math.random().toString(36).substring(2, 7),
        shop_id: id,
        type: p.type,
        url: p.url,
        sort_order: i,
      })) : shops[idx].platforms
    }
    saveLocalShops(shops)
  }
}

export async function deleteShop(id) {
  if (supabaseConfigured) {
    try {
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (!error) return
    } catch (e) {
      console.warn('Supabase deleteShop failed, fallback to local', e)
    }
  }
  const shops = getLocalShops().filter(s => s.id !== id)
  saveLocalShops(shops)
}

export async function toggleShopActive(id, active) {
  if (supabaseConfigured) {
    try {
      const { error } = await supabase.from('shops').update({ active }).eq('id', id)
      if (!error) return
    } catch (e) {
      console.warn('Supabase toggleShopActive failed, fallback to local', e)
    }
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
export async function adminSignIn(email, password) {
  if (supabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }
  // Local demo login
  if (email && password) {
    localStorage.setItem('nfc_demo_session', 'true')
    return { user: { email, id: 'demo-admin' } }
  }
  throw new Error('Please enter an email and password')
}

export async function adminSignOut() {
  localStorage.removeItem('nfc_demo_session')
  if (supabaseConfigured) {
    try {
      await supabase.auth.signOut()
    } catch {}
  }
}

export async function getSession() {
  if (localStorage.getItem('nfc_demo_session') === 'true') {
    return { user: { email: 'admin@demo.com', id: 'demo-admin' } }
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
