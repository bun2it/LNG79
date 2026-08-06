import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, 'dist');
const uploadsDir = path.join(rootDir, 'public', 'uploads');
const port = Number(process.env.PORT || 4173);
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const groqApiKey = process.env.GROQ_API_KEY || '';
const groqModel = process.env.GROQ_TRANSLATION_MODEL || 'llama-3.3-70b-versatile';
const adminUsername = process.env.ADMIN_USERNAME || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseAuth = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  : null;
const sessions = new Map();
const loginAttempts = new Map();
const sessionMaxAge = 8 * 60 * 60 * 1000;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf' };

fs.mkdirSync(uploadsDir, { recursive: true });

const json = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
};

const readBody = (req, limit = 64 * 1024) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => { size += chunk.length; if (size <= limit) chunks.push(chunk); });
  req.on('end', () => size > limit ? reject(new Error('Request too large')) : resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});
const cookies = (req) => Object.fromEntries(String(req.headers.cookie || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter((pair) => pair.length === 2));
const currentSession = (req) => {
  const token = cookies(req).lng79_session;
  const expiresAt = token ? sessions.get(token) : undefined;
  if (!token || !expiresAt || expiresAt <= Date.now()) { if (token) sessions.delete(token); return null; }
  return token;
};
const bearerToken = (req) => {
  const authorization = String(req.headers.authorization || '');
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
};
const getSupabaseCmsRole = async (req) => {
  const token = bearerToken(req);
  if (!supabaseAuth || !token) return null;
  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) return null;
    const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: profile, error: profileError } = await requestClient
      .from('profiles')
      .select('role,status')
      .eq('id', data.user.id)
      .maybeSingle();
    return !profileError && profile?.status === 'active' && ['owner', 'admin', 'editor', 'translator'].includes(profile.role)
      ? profile.role
      : null;
  } catch {
    return null;
  }
};
const isSameOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
};
const safeEqual = (left, right) => {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
};

const safeFileName = (originalName, type) => {
  const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' })[type];
  const base = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'image';
  return `${Date.now()}-${base}${extension}`;
};

const serveFile = (res, filePath) => {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const extension = path.extname(filePath).toLowerCase();
  const headers = { 'Content-Type': mime[extension] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
  if (extension === '.pdf') headers['Content-Disposition'] = `inline; filename="${path.basename(filePath).replace(/["\r\n]/g, '')}"`;
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
  return true;
};

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  if (requestUrl.pathname === '/api/auth/status' && req.method === 'GET') return json(res, 200, { authenticated: Boolean(currentSession(req)) || Boolean(await getSupabaseCmsRole(req)) });
  if (requestUrl.pathname === '/api/auth/login' && req.method === 'POST') {
    if (!adminUsername || !adminPassword) return json(res, 503, { error: 'ADMIN_USERNAME và ADMIN_PASSWORD chưa được cấu hình trên server.' });
    const address = req.socket.remoteAddress || 'unknown';
    const attempt = loginAttempts.get(address) || { count: 0, blockedUntil: 0 };
    if (attempt.blockedUntil > Date.now()) return json(res, 429, { error: 'Đăng nhập tạm khóa. Vui lòng thử lại sau.' });
    readBody(req).then((body) => {
      try {
        const payload = JSON.parse(body.toString('utf8'));
        if (!safeEqual(String(payload.username || ''), adminUsername) || !safeEqual(String(payload.password || ''), adminPassword)) {
          const count = attempt.count + 1;
          loginAttempts.set(address, { count, blockedUntil: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
          return json(res, 401, { error: 'Sai tài khoản hoặc mật khẩu.' });
        }
        loginAttempts.delete(address);
        const token = crypto.randomBytes(32).toString('base64url');
        sessions.set(token, Date.now() + sessionMaxAge);
        const secure = String(req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https' ? '; Secure' : '';
        res.setHeader('Set-Cookie', `lng79_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionMaxAge / 1000}${secure}`);
        json(res, 200, { authenticated: true });
      } catch { json(res, 400, { error: 'Yêu cầu đăng nhập không hợp lệ.' }); }
    }).catch(() => json(res, 413, { error: 'Yêu cầu quá lớn.' }));
    return;
  }
  if (requestUrl.pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = currentSession(req); if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'lng79_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return json(res, 200, { authenticated: false });
  }
  const legacySession = currentSession(req);
  const cmsRole = legacySession ? 'owner' : await getSupabaseCmsRole(req);
  if (requestUrl.pathname.startsWith('/api/') && (!cmsRole || !isSameOrigin(req))) return json(res, 401, { error: 'Phiên quản trị không hợp lệ hoặc đã hết hạn.' });
  if (requestUrl.pathname.startsWith('/api/uploads') && !['owner', 'admin', 'editor'].includes(cmsRole)) return json(res, 403, { error: 'Vai trò hiện tại không có quyền quản lý Media Vault.' });
  if (requestUrl.pathname === '/api/ai/translate' && req.method === 'POST') {
    if (!groqApiKey) return json(res, 503, { error: 'GROQ_API_KEY chưa được cấu hình trên server.' });
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => { size += chunk.length; if (size <= 1024 * 1024) chunks.push(chunk); });
    req.on('end', async () => {
      try {
        if (size > 1024 * 1024) throw new Error('Translation request is too large');
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const entries = Array.isArray(payload.entries) ? payload.entries.slice(0, 50) : [];
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqApiKey}` },
          body: JSON.stringify({
            model: groqModel,
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'You are a professional Vietnamese-to-English translator for industrial LNG, LPG, gas safety, EPC engineering, and commercial kitchen websites. Return JSON only in the exact shape {"translations":[{"id":"same id","text":"English translation"}]}. Preserve numbers, units, standards, model names, formatting, and brand names. Do not omit or merge entries.' },
              { role: 'user', content: JSON.stringify({ entries }) },
            ],
          }),
        });
        const groq = await response.json();
        if (!response.ok) throw new Error(groq.error?.message || 'Groq API request failed');
        const result = JSON.parse(groq.choices?.[0]?.message?.content || '{}');
        if (!Array.isArray(result.translations)) throw new Error('Groq returned an invalid translation response');
        json(res, 200, { translations: result.translations });
      } catch (error) {
        json(res, 500, { error: error instanceof Error ? error.message : 'Translation failed' });
      }
    });
    return;
  }
  if (requestUrl.pathname === '/api/uploads' && req.method === 'GET') {
    const images = fs.readdirSync(uploadsDir)
      .filter((file) => /\.(jpe?g|png|webp|gif|svg|pdf)$/i.test(file))
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
    if (!allowedTypes.has(type)) return json(res, 415, { error: 'Chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc PDF.' });
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
