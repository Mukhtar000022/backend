// Обёртка над Prisma CLI: собирает DATABASE_URL из отдельных переменных .env
// и запускает нужную команду prisma. Используется в npm-скриптах, например:
//   node --env-file=.env scripts/prisma.js migrate dev
const { spawnSync } = require('child_process');
const { buildDatabaseUrl } = require('../config/database');

process.env.DATABASE_URL = buildDatabaseUrl();

const res = spawnSync('npx', ['prisma', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(res.status ?? 1);
