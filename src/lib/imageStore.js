// Сохранение картинок, присланных как data:URL (base64) — так обходимся
// без multipart и лишних зависимостей. Файлы лежат в backend/uploads
// и отдаются статикой по /uploads/... (см. server.js).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const httpError = require('./httpError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const DEFAULT_MAX_BYTES = 6 * 1024 * 1024; // 6 МБ

/**
 * Принимает "data:image/png;base64,..." (или голый base64) и кладёт файл.
 * Возвращает относительный URL вида /uploads/имя.png
 */
function saveImage(raw, { maxBytes = DEFAULT_MAX_BYTES, prefix = '' } = {}) {
  const str = String(raw || '');
  const m = str.match(/^data:image\/(png|jpe?g|webp|svg\+xml);base64,(.+)$/);
  const base64 = m ? m[2] : str;
  const ext = m ? { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', 'svg+xml': 'svg' }[m[1]] : 'jpg';
  if (!base64) throw httpError(400, 'Сурет жіберілмеді');

  const buf = Buffer.from(base64, 'base64');
  if (!buf.length) throw httpError(400, 'Сурет бүлінген');
  if (buf.length > maxBytes) {
    throw httpError(400, `Сурет тым үлкен (${Math.round(maxBytes / 1024 / 1024)} МБ дейін)`);
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${prefix}${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return '/uploads/' + name;
}

/** Удаляет файл по относительному URL; отсутствие файла не считается ошибкой. */
function removeImage(url) {
  if (!url) return;
  try {
    fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(String(url))));
  } catch (e) {
    /* файла уже нет — не страшно */
  }
}

module.exports = { saveImage, removeImage, UPLOAD_DIR };
