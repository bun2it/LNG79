import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const uploadsDir = path.resolve(process.cwd(), 'public/uploads')
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
const devSessions = new Set<string>()
const cookieValue = (req: import('node:http').IncomingMessage, name: string) => String(req.headers.cookie || '').split(';').map((part) => part.trim().split('=')).find(([key]) => key === name)?.[1]
const devAuthenticated = (req: import('node:http').IncomingMessage) => Boolean(cookieValue(req, 'lng79_session') && devSessions.has(cookieValue(req, 'lng79_session')!))
const bearerToken = (req: import('node:http').IncomingMessage) => {
  const authorization = String(req.headers.authorization || '')
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
}
const supabaseAuthenticated = async (req: import('node:http').IncomingMessage, url: string, publishableKey: string, _allowedRoles: string[]) => {
  const token = bearerToken(req)
  if (!url || !publishableKey || !token) return false
  try {
    const baseUrl = url.replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return false
    const user = await response.json() as { id?: string }
    if (!user.id) return false
    const profileResponse = await fetch(`${baseUrl}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}&select=account_type,status`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    })
    if (!profileResponse.ok) return false
    const usersList = await profileResponse.json() as Array<{ account_type?: string; status?: string }>
    return usersList.length === 1 && usersList[0].status === 'active' && usersList[0].account_type === 'admin'
  } catch {
    return false
  }
}

const authPlugin = (adminUsername: string, adminPassword: string) => ({
  name: 'lng79-admin-auth',
  configureServer(server: { middlewares: { use: (path: string, handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void) => void } }) {
    server.middlewares.use('/api/auth/status', (req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ authenticated: devAuthenticated(req) })) })
    server.middlewares.use('/api/auth/logout', (req, res) => { const token = cookieValue(req, 'lng79_session'); if (token) devSessions.delete(token); res.setHeader('Set-Cookie', 'lng79_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.end(JSON.stringify({ authenticated: false })) })
    server.middlewares.use('/api/auth/login', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      if (!adminUsername || !adminPassword) { res.statusCode = 503; res.end(JSON.stringify({ error: 'ADMIN_USERNAME và ADMIN_PASSWORD chưa được cấu hình.' })); return }
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (body.username !== adminUsername || body.password !== adminPassword) { res.statusCode = 401; res.end(JSON.stringify({ error: 'Sai tài khoản hoặc mật khẩu.' })); return }
          const token = crypto.randomBytes(32).toString('base64url'); devSessions.add(token)
          res.setHeader('Set-Cookie', `lng79_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`)
          res.end(JSON.stringify({ authenticated: true }))
        } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'Yêu cầu không hợp lệ.' })) }
      })
    })
  },
})

const groqTranslationPlugin = (apiKey: string, model: string, supabaseUrl: string, supabasePublishableKey: string) => ({
  name: 'lng79-groq-translation',
  configureServer(server: { middlewares: { use: (path: string, handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void) => void } }) {
    server.middlewares.use('/api/ai/translate', async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (!(devAuthenticated(req) || await supabaseAuthenticated(req, supabaseUrl, supabasePublishableKey, ['owner', 'admin', 'editor', 'translator']))) { res.statusCode = 401; res.end(JSON.stringify({ error: 'Phiên quản trị không hợp lệ.' })); return }
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }
      if (!apiKey) {
        res.statusCode = 503
        res.end(JSON.stringify({ error: 'GROQ_API_KEY chưa được cấu hình trên server.' }))
        return
      }
      const chunks: Buffer[] = []
      let size = 0
      req.on('data', (chunk: Buffer) => { size += chunk.length; if (size <= 1024 * 1024) chunks.push(chunk) })
      req.on('end', async () => {
        try {
          if (size > 1024 * 1024) throw new Error('Translation request is too large')
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          const entries = Array.isArray(payload.entries) ? payload.entries.slice(0, 50) : []
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model,
              temperature: 0.1,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: 'You are a professional Vietnamese-to-English translator for industrial LNG, LPG, gas safety, EPC engineering, and commercial kitchen websites. Return JSON only in the exact shape {"translations":[{"id":"same id","text":"English translation"}]}. Preserve numbers, units, standards, model names, HTML-free formatting, and brand names. Do not omit or merge entries.' },
                { role: 'user', content: JSON.stringify({ entries }) },
              ],
            }),
          })
          const groq = await response.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> }
          if (!response.ok) throw new Error(groq.error?.message || 'Groq API request failed')
          const result = JSON.parse(groq.choices?.[0]?.message?.content || '{}')
          if (!Array.isArray(result.translations)) throw new Error('Groq returned an invalid translation response')
          res.end(JSON.stringify({ translations: result.translations }))
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Translation failed' }))
        }
      })
    })
  },
})

const imageLibraryPlugin = (supabaseUrl: string, supabasePublishableKey: string) => ({
  name: 'lng79-image-library',
  configureServer(server: { middlewares: { use: (path: string, handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void) => void } }) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    server.middlewares.use('/api/uploads', async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (!(devAuthenticated(req) || await supabaseAuthenticated(req, supabaseUrl, supabasePublishableKey, ['owner', 'admin', 'editor']))) { res.statusCode = 401; res.end(JSON.stringify({ error: 'Phiên quản trị không hợp lệ.' })); return }
      if (req.method === 'GET') {
        const images = fs.readdirSync(uploadsDir)
          .filter((file) => /\.(jpe?g|png|webp|gif|svg|pdf)$/i.test(file))
          .map((file) => {
            const stat = fs.statSync(path.join(uploadsDir, file))
            return { name: file, url: `/uploads/${encodeURIComponent(file)}`, size: stat.size, uploadedAt: stat.mtime.toISOString() }
          })
        res.end(JSON.stringify(images))
        return
      }
      if (req.method === 'DELETE') {
        const requestUrl = new URL(req.url || '', 'http://localhost')
        const fileName = path.basename(requestUrl.searchParams.get('name') || '')
        const filePath = path.join(uploadsDir, fileName)
        if (fileName && fs.existsSync(filePath)) fs.unlinkSync(filePath)
        res.end(JSON.stringify({ deleted: fileName }))
        return
      }
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }
      const type = String(req.headers['content-type'] || '')
      const originalName = decodeURIComponent(String(req.headers['x-file-name'] || 'image'))
      if (!allowedImageTypes.has(type)) {
        res.statusCode = 415
        res.end(JSON.stringify({ error: 'Chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc PDF.' }))
        return
      }
      const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' } as Record<string, string>)[type]
      const base = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'image'
      const fileName = `${Date.now()}-${base}${extension}`
      const chunks: Buffer[] = []
      let size = 0
      req.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size <= 10 * 1024 * 1024) chunks.push(chunk)
      })
      req.on('end', () => {
        if (size > 10 * 1024 * 1024) {
          res.statusCode = 413
          res.end(JSON.stringify({ error: 'Ảnh không được vượt quá 10 MB.' }))
          return
        }
        fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.concat(chunks))
        res.end(JSON.stringify({ name: fileName, url: `/uploads/${encodeURIComponent(fileName)}` }))
      })
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      authPlugin(env.ADMIN_USERNAME || '', env.ADMIN_PASSWORD || ''),
      imageLibraryPlugin(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
      groqTranslationPlugin(
        env.GROQ_API_KEY || process.env.GROQ_API_KEY || '',
        env.GROQ_TRANSLATION_MODEL || 'llama-3.3-70b-versatile',
        env.VITE_SUPABASE_URL || '',
        env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      ),
    ],
  }
})
