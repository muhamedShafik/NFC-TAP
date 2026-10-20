import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import forgotPasswordHandler from './api/forgot-password.js'
import resetPasswordHandler from './api/reset-password.js'

import fs from 'fs'
import path from 'path'

function apiDevPlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/forgot-password' || url === '/api/reset-password') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            req.body = body
            try {
              if (url === '/api/forgot-password') {
                await forgotPasswordHandler(req, res)
              } else {
                await resetPasswordHandler(req, res)
              }
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
})
