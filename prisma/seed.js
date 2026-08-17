// Перенос данных из старых JSON-файлов (db.json, leads.json) в БД.
// Идемпотентно: повторный запуск не создаёт дубликатов.
const fs = require('fs');
const path = require('path');
const { prisma } = require('../db'); // общий клиент: DATABASE_URL собирается из частей .env

const CONTENT_SECTIONS = ['home', 'education', 'parents', 'courses', 'gallery', 'contacts'];

function readJSONSafe(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) {
    return fallback;
  }
}

async function main() {
  const db = readJSONSafe(path.join(__dirname, '..', 'db.json'), {});
  const leads = readJSONSafe(path.join(__dirname, '..', 'leads.json'), []);

  // 1) Разделы контента
  for (const key of CONTENT_SECTIONS) {
    if (db[key] === undefined) continue;
    const data = JSON.stringify(db[key]);
    await prisma.contentSection.upsert({
      where: { key },
      update: { data },
      create: { key, data },
    });
  }

  // 2) Настройки оплаты
  const pay = (db.settings && db.settings.payment) || {};
  await prisma.paymentSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      enabled: pay.enabled !== false,
      design: pay.design || 'outline',
      amount: pay.amount || '15 000 ₸',
      title: pay.title || 'Оплата за обучение',
      kaspiUrl: pay.kaspiUrl || '',
    },
  });

  // 3) Заявки (если были)
  for (const l of Array.isArray(leads) ? leads : []) {
    if (!l || !l.id) continue;
    const createdAt = l.createdAt ? new Date(l.createdAt) : new Date();
    await prisma.lead.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        type: l.type || 'consultation',
        name: l.name || '',
        phone: l.phone || '',
        message: l.message || '',
        status: l.status || 'new',
        createdAt,
      },
    });
  }

  const counts = {
    sections: await prisma.contentSection.count(),
    leads: await prisma.lead.count(),
    settings: await prisma.paymentSetting.count(),
  };
  console.log('Seed завершён:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
