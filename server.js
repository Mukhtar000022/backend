const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ayala2026';

const CONTENT_PATH = path.join(__dirname, 'db.json');
const LEADS_PATH = path.join(__dirname, 'leads.json');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/admin', express.static(path.join(__dirname, 'public')));

// --- auth middleware ---
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль или сессия истекла' });
  }
  next();
}

// --- health ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- public content ---
app.get('/api/content', (req, res) => {
  res.json(readJSON(CONTENT_PATH));
});

// --- admin login ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_PASSWORD });
  }
  res.status(401).json({ error: 'Неверный пароль' });
});

// --- admin content edit (replace one section) ---
app.put('/api/admin/content/:section', requireAdmin, (req, res) => {
  const { section } = req.params;
  const content = readJSON(CONTENT_PATH);
  if (!(section in content)) {
    return res.status(404).json({ error: 'Раздел не найден' });
  }
  content[section] = req.body;
  writeJSON(CONTENT_PATH, content);
  res.json({ ok: true, content });
});

// --- public: submit a lead / заявка ---
app.post('/api/leads', (req, res) => {
  const { type, name, phone, message } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: 'Укажите имя и телефон' });
  }
  const leads = readJSON(LEADS_PATH);
  const lead = {
    id: nanoid(10),
    type: type || 'consultation',
    name,
    phone,
    message: message || '',
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  leads.unshift(lead);
  writeJSON(LEADS_PATH, leads);
  res.status(201).json({ ok: true, lead });
});

// --- admin: list leads ---
app.get('/api/admin/leads', requireAdmin, (req, res) => {
  res.json(readJSON(LEADS_PATH));
});

// --- admin: update lead status ---
app.patch('/api/admin/leads/:id', requireAdmin, (req, res) => {
  const leads = readJSON(LEADS_PATH);
  const idx = leads.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Заявка не найдена' });
  leads[idx] = { ...leads[idx], ...req.body };
  writeJSON(LEADS_PATH, leads);
  res.json({ ok: true, lead: leads[idx] });
});

// --- admin: delete lead ---
app.delete('/api/admin/leads/:id', requireAdmin, (req, res) => {
  let leads = readJSON(LEADS_PATH);
  leads = leads.filter((l) => l.id !== req.params.id);
  writeJSON(LEADS_PATH, leads);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Ayala Kids backend running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
