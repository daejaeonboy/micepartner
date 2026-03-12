import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { adminRepository, inquiryRepository, siteDataRepository } from './db.js';

const app = express();
const port = Number(process.env.API_PORT || 8787);
const validStatuses = ['new', 'in_progress', 'completed'];
const googleClientId = String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || process.env.VITE_APP_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('허용되지 않은 Origin입니다.'));
  },
  credentials: true,
}));
app.use(express.json());

function getSessionToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return String(req.headers['x-admin-token'] || '').trim();
}

async function requireAdmin(req, res, next) {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({ message: '관리자 인증이 필요합니다.' });
  }

  const user = adminRepository.getSessionUser(token);
  if (!user) {
    return res.status(401).json({ message: '로그인 세션이 만료되었거나 유효하지 않습니다.' });
  }

  req.adminUser = user;
  req.adminToken = token;
  return next();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyGoogleCredential(credential) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (googleClientId && data.aud !== googleClientId) {
    return null;
  }

  if (data.email_verified !== 'true' || !data.sub || !data.email) {
    return null;
  }

  return {
    googleSub: String(data.sub),
    email: String(data.email).toLowerCase(),
    name: String(data.name || data.given_name || data.email.split('@')[0]),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/api/admin/signup', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();

  if (!name || !email || !password) {
    return res.status(400).json({ message: '이름, 이메일, 비밀번호를 모두 입력해 주세요.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: '올바른 이메일 형식이 아닙니다.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 8자 이상이어야 합니다.' });
  }

  const existing = adminRepository.getByEmail(email);
  if (existing) {
    return res.status(409).json({ message: '이미 등록된 관리자 이메일입니다.' });
  }

  const user = adminRepository.createPasswordUser({ name, email, password });
  const token = adminRepository.createSession(user.id);
  return res.status(201).json({ token, user });
});

app.post('/api/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
  }

  const user = adminRepository.verifyPasswordUser(email, password);

  if (!user) {
    return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const token = adminRepository.createSession(user.id);
  return res.json({ token, user });
});

app.post('/api/admin/google', async (req, res) => {
  const credential = String(req.body?.credential || '').trim();

  if (!credential) {
    return res.status(400).json({ message: 'Google 로그인 정보가 비어 있습니다.' });
  }

  try {
    const verified = await verifyGoogleCredential(credential);

    if (!verified) {
      return res.status(401).json({ message: 'Google 로그인 검증에 실패했습니다.' });
    }

    const user = adminRepository.createOrUpdateGoogleUser(verified);
    const token = adminRepository.createSession(user.id);
    return res.json({ token, user });
  } catch {
    return res.status(502).json({ message: 'Google 인증 서버와 통신하지 못했습니다.' });
  }
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ user: req.adminUser });
});

app.delete('/api/admin/session', requireAdmin, (req, res) => {
  adminRepository.deleteSession(req.adminToken);
  res.json({ ok: true });
});

app.get('/api/site-data', (_req, res) => {
  res.json({ item: siteDataRepository.get() });
});

app.put('/api/site-data', requireAdmin, (req, res) => {
  const item = req.body?.item;

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return res.status(400).json({ message: '저장할 사이트 데이터가 올바르지 않습니다.' });
  }

  const saved = siteDataRepository.save(item);
  return res.json({ item: saved });
});

app.get('/api/inquiries', requireAdmin, (_req, res) => {
  res.json({ items: inquiryRepository.list() });
});

app.post('/api/inquiries', (req, res) => {
  const organizationName = String(req.body?.organizationName || '').trim();
  const contactName = String(req.body?.contactName || '').trim();
  const email = String(req.body?.email || '').trim();
  const eventDate = String(req.body?.eventDate || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!organizationName || !contactName || !email || !message) {
    return res.status(400).json({ message: '기관명, 담당자명, 이메일, 문의 내용은 필수입니다.' });
  }

  const created = inquiryRepository.create({
    organizationName,
    contactName,
    email,
    eventDate,
    message,
  });

  return res.status(201).json({ item: created });
});

app.patch('/api/inquiries/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '').trim();
  const notes = String(req.body?.notes || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: '잘못된 문의 ID입니다.' });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: '허용되지 않은 상태값입니다.' });
  }

  const existing = inquiryRepository.getById(id);
  if (!existing) {
    return res.status(404).json({ message: '문의 정보를 찾을 수 없습니다.' });
  }

  const updated = inquiryRepository.update(id, {
    status,
    notes,
  });

  return res.json({ item: updated });
});

app.listen(port, () => {
  console.log(`Inquiry API listening on http://127.0.0.1:${port}`);
});
