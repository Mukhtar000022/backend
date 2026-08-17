// Единый экземпляр Prisma Client на всё приложение.
// Все entity-модули и server.js используют этот клиент (один пул соединений).
const { PrismaClient } = require('@prisma/client');
const { buildDatabaseUrl } = require('./config/database');

// Prisma Client читает DATABASE_URL из окружения — собираем его из частей .env
// (DATABASE_NAME, DATABASE_USERNAME, ...) до создания клиента.
process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = global.__ayalaPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  global.__ayalaPrisma = prisma;
}

module.exports = { prisma };
