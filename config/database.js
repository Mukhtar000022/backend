// Собирает строку подключения PostgreSQL из отдельных переменных .env
// (DATABASE_NAME, DATABASE_USERNAME, ...). Prisma умеет читать только одну
// переменную DATABASE_URL — этот модуль формирует её из частей.
//
// Если DATABASE_URL задан напрямую — он имеет приоритет (удобно для облачных
// провайдеров, которые выдают готовую строку).

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || '5432';
  const name = process.env.DATABASE_NAME || 'ayalakids';
  const user = process.env.DATABASE_USERNAME || 'postgres';
  const pass = process.env.DATABASE_PASSWORD || 'Muha7777';
  const ssl = String(process.env.DATABASE_SSL).toLowerCase() === 'true';

  // Экранируем логин/пароль — вдруг там есть символы @ : / ? #
  const auth = pass
    ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}`
    : encodeURIComponent(user);

  const sslmode = ssl ? 'require' : 'disable';
  return `postgresql://${auth}@${host}:${port}/${name}?schema=public&sslmode=${sslmode}`;
}

module.exports = { buildDatabaseUrl };
