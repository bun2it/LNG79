import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, 'dist');
const uploadsDir = path.join(rootDir, 'public', 'uploads');
const port = Number(process.env.PORT || 4173);
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

fs.mkdirSync(uploadsDir, { recursive: true });

const json = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
};

const safeFileName = (originalName, type) => {
  const extension = path.extname(originalName).toLowerCase() || `.${type.split('/')[1]}`;
  const base = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'image';
  return `${Date.now()}-${base}${extension}`;
};

const serveFile = (res, filePath) => {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  res.writeHead(200, { 'Content-Type': `${mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'}; charset=utf-8` });
  fs.createReadStream(filePath).pipe(res);
  return true;
};

http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  if (requestUrl.pathname === '/api/uploads' && req.method === 'GET') {
    const images = fs.readdirSync(uploadsDir)
      .filter((file) => /\.(jpe?g|png|webp|gif|svg)$/i.test(file))
      .map((file) => {
        const stat = fs.statSync(path.join(uploadsDir, file));
        return { name: file, url: `/uploads/${encodeURIComponent(file)}`, size: stat.size, uploadedAt: stat.mtime.toISOString() };
      });
    json(res, 200, images);
    return;
  }
  if (requestUrl.pathname === '/api/uploads' && req.method === 'DELETE') {
    const fileName = path.basename(requestUrl.searchParams.get('name') || '');
    const filePath = path.join(uploadsDir, fileName);
    if (fileName && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    json(res, 200, { deleted: fileName });
    return;
  }
  if (requestUrl.pathname === '/api/uploads' && req.method === 'POST') {
    const type = String(req.headers['content-type'] || '');
    const originalName = decodeURIComponent(String(req.headers['x-file-name'] || 'image'));
    if (!allowedTypes.has(type)) return json(res, 415, { error: 'Chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc SVG.' });
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= 10 * 1024 * 1024) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > 10 * 1024 * 1024) return json(res, 413, { error: 'Ảnh không được vượt quá 10 MB.' });
      const fileName = safeFileName(originalName, type);
      fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.concat(chunks));
      json(res, 200, { name: fileName, url: `/uploads/${encodeURIComponent(fileName)}` });
    });
    return;
  }
  if (requestUrl.pathname.startsWith('/uploads/')) {
    const fileName = path.basename(decodeURIComponent(requestUrl.pathname));
    if (serveFile(res, path.join(uploadsDir, fileName))) return;
  }
  const relativePath = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname.replace(/^\/+/, '');
  const requested = path.resolve(distDir, relativePath);
  if (requested.startsWith(distDir) && serveFile(res, requested)) return;
  if (!serveFile(res, path.join(distDir, 'index.html'))) {
    json(res, 404, { error: 'Run npm run build before npm start.' });
  }
}).listen(port, () => {
  console.log(`LNG79 server running at http://localhost:${port}`);
});
