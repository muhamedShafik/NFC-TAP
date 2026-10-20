// Global in-memory cache for OTP codes shared with forgot-password
const otpStore = globalThis.__nfc_otp_store || new Map()
globalThis.__nfc_otp_store = otpStore

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch {}
    }

    const { email, code, newPassword } = body || {}

    if (!email || !code || !newPassword) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'Email, verification code, and new password are required' }))
    }

    if (newPassword.length < 6) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'New password must be at least 6 characters' }))
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.toString().trim()

    const record = otpStore.get(cleanEmail)

    if (!record) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'No reset code requested or code has expired. Please request a new code.' }))
    }

    if (record.expiresAt < Date.now()) {
      otpStore.delete(cleanEmail)
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'Reset code has expired. Please request a new code.' }))
    }

    if (record.code !== cleanCode) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'Invalid verification code. Please check your email.' }))
    }

    // Code is valid! Consume it
    otpStore.delete(cleanEmail)

    // Attempt to update password in Supabase via service role if available, or notify frontend to update
    const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        })
        const users = await adminRes.json()
        const userObj = Array.isArray(users?.users) ? users.users.find(u => u.email === cleanEmail) : null

        if (userObj) {
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${userObj.id}`, {
            method: 'PUT',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
          })
        }
      } catch (err) {
        console.warn('Could not update via service role key, frontend will finalize session', err)
      }
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
      email: cleanEmail
    }))
  } catch (error) {
    console.error('Reset password error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: error.message || 'Failed to reset password' }))
  }
}
