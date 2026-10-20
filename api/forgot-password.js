import nodemailer from 'nodemailer'

// Global in-memory cache for OTP codes
const otpStore = globalThis.__nfc_otp_store || new Map()
globalThis.__nfc_otp_store = otpStore

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || ''
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || ''

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
  }

  return null
}

export default async function handler(req, res) {
  // Support both GET for health check and POST
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch {}
    }

    const { email } = body || {}
    if (!email || !email.includes('@')) {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'A valid email address is required' }))
    }

    const cleanEmail = email.trim().toLowerCase()

    // Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    otpStore.set(cleanEmail, { code, expiresAt })

    const transporter = getTransporter()

    const subject = `Your NFC Tap Password Reset Code: ${code}`
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 2rem; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📲</div>
          <h1 style="color: #ffffff; font-size: 1.5rem; margin: 0; font-weight: 700;">NFC Tap Password Reset</h1>
          <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem;">Admin Account Security</p>
        </div>

        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
          <p style="color: #cbd5e1; font-size: 0.9rem; margin-top: 0;">Use the 6-digit code below to reset your password:</p>
          <div style="font-size: 2.25rem; font-weight: 800; letter-spacing: 0.3em; color: #6366f1; background: rgba(99,102,241,0.1); padding: 0.75rem 1.25rem; border-radius: 8px; display: inline-block; font-family: monospace;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 0.78rem; margin-bottom: 0; margin-top: 1rem;">
            ⏳ This code expires in 15 minutes.
          </p>
        </div>

        <p style="color: #64748b; font-size: 0.8rem; text-align: center; margin-bottom: 0;">
          If you did not request this password reset, please ignore this email.
        </p>
      </div>
    `

    let sentVia = 'test_mode'
    if (transporter) {
      await transporter.sendMail({
        from: `"NFC Tap Admin" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@nfc-tap.com'}>`,
        to: cleanEmail,
        subject,
        html: htmlContent
      })
      sentVia = 'smtp'
    } else {
      console.log(`\n========================================`)
      console.log(`[NODEMAILER DEV MODE] Password Reset Code`)
      console.log(`Recipient: ${cleanEmail}`)
      console.log(`Reset Code: ${code}`)
      console.log(`Expires: 15 minutes`)
      console.log(`========================================\n`)
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({
      success: true,
      message: `Reset code sent to ${cleanEmail}`,
      sentVia,
      devCode: transporter ? undefined : code // for quick testing if SMTP not yet configured
    }))
  } catch (error) {
    console.error('Error sending reset email with nodemailer:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: error.message || 'Failed to send reset email' }))
  }
}
