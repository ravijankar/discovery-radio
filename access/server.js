require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
const db = new Database(process.env.DB_PATH || 'invites.db');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PORT = process.env.PORT || 3001;
const STREAM_URL = process.env.STREAM_URL || '';

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is required');
  process.exit(1);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS invites (
    id    TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    revoked_at  INTEGER,
    last_used_at INTEGER
  )
`);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// In-memory sessions — fine for single-admin use; resets on restart
const sessions = new Set();

function requireAdmin(req, res, next) {
  const s = req.cookies.session;
  if (s && sessions.has(s)) return next();
  res.status(401).json({ error: 'unauthorized' });
}

// ── Auth callback for Caddy forward_auth ──────────────────────────────────────
// Caddy sets X-Forwarded-Uri to the original request URI, so the token query
// param from the listener's stream request arrives via that header.
app.get('/auth/check', (req, res) => {
  let token = req.query.token;
  if (!token) {
    const fwd = req.headers['x-forwarded-uri'] || '';
    token = new URLSearchParams(fwd.split('?')[1] || '').get('token');
  }
  if (!token) return res.status(401).send('no token');

  const invite = db.prepare('SELECT * FROM invites WHERE token = ?').get(token);
  if (!invite || invite.revoked_at) return res.status(401).send('invalid');

  db.prepare('UPDATE invites SET last_used_at = ? WHERE id = ?')
    .run(Date.now(), invite.id);

  res.status(200).send('ok');
});

// ── Admin session ─────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'invalid password' });
  const session = crypto.randomBytes(32).toString('hex');
  sessions.add(session);
  res.cookie('session', session, { httpOnly: true, sameSite: 'strict' });
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  sessions.delete(req.cookies.session);
  res.clearCookie('session');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const s = req.cookies.session;
  res.json({ authenticated: !!(s && sessions.has(s)) });
});

// ── Invites ───────────────────────────────────────────────────────────────────
app.get('/api/invites', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM invites ORDER BY created_at DESC').all());
});

app.post('/api/invites', requireAdmin, (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: 'label required' });
  const invite = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(24).toString('base64url'),
    label,
    created_at: Date.now(),
  };
  db.prepare('INSERT INTO invites (id, token, label, created_at) VALUES (?, ?, ?, ?)')
    .run(invite.id, invite.token, invite.label, invite.created_at);
  res.json(invite);
});

app.delete('/api/invites/:id', requireAdmin, (req, res) => {
  const result = db.prepare('UPDATE invites SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')
    .run(Date.now(), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'not found or already revoked' });
  res.json({ ok: true });
});

// ── Config for listener page ──────────────────────────────────────────────────
app.get('/config.json', (req, res) => {
  res.json({ streamUrl: STREAM_URL });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`discovery-auth listening on :${PORT}`));
