const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('./db'); // инициализирует Prisma Client и собирает DATABASE_URL из .env

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
// Лимит увеличен: фото группы приходят от воспитателя как base64.
app.use(express.json({ limit: '12mb' }));

// Загруженные воспитателями фото.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

// Админ-панель (статика)
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Мобильное приложение: выбор роли (родитель / воспитатель) → вход по телефону.
app.use('/app', express.static(path.join(__dirname, 'public', 'app')));
app.get('/', (req, res) => res.redirect('/app/'));

// Все REST API (модули: auth, users, groups, parents, students, tutors,
// content, settings, leads, payments)
app.use('/api', require('./src/routes'));

// --- общий обработчик ошибок (в т.ч. ошибки Prisma) ---
app.use((err, req, res, next) => {
  if (err && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Запись с такими данными уже существует' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Запись не найдена' });
    if (err.code === 'P2003') return res.status(400).json({ error: 'Нарушена связь: проверьте group_id / user_id / parent_id' });
    return res.status(400).json({ error: 'Ошибка данных (' + err.code + ')' });
  }
  // Ошибки с явным HTTP-статусом (валидация, доступ и т.п.).
  if (err && Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// HTTP-сервер создаём явно: к нему же подключается WebSocket чата (путь /ws).
const server = http.createServer(app);
require('./src/realtime/ws').attach(server);

server.listen(PORT, () => {
  console.log(`Ayala Kids backend running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Приложение:  http://localhost:${PORT}/app`);
  console.log(`Чат (WebSocket): ws://localhost:${PORT}/ws`);
});
