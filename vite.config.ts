import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const uploadsDir = path.resolve(process.cwd(), 'public/uploads')
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])

const imageLibraryPlugin = () => ({
  name: 'lng79-image-library',
  configureServer(server: { middlewares: { use: (path: string, handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void) => void } }) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    server.middlewares.use('/api/uploads', (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (req.method === 'GET') {
        const images = fs.readdirSync(uploadsDir)
          .filter((file) => /\.(jpe?g|png|webp|gif|svg)$/i.test(file))
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
        res.end(JSON.stringify({ error: 'Chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc SVG.' }))
        return
      }
      const extension = path.extname(originalName).toLowerCase() || `.${type.split('/')[1]}`
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
export default defineConfig({
  plugins: [react(), imageLibraryPlugin()],
})
