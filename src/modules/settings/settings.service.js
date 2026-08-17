const repo = require('./settings.repo');

const PAY_BUTTON_DESIGNS = ['solid', 'gradient', 'outline', 'soft', 'glow', 'card'];

const DEFAULT_PAYMENT = {
  enabled: true,
  design: 'outline',
  amount: '15 000 ₸',
  title: 'Оплата за обучение',
  kaspiUrl: 'https://kaspi.kz/pay/REPLACE_ME',
};

function paymentToJSON(row) {
  if (!row) return { ...DEFAULT_PAYMENT };
  return {
    enabled: row.enabled,
    design: row.design,
    amount: row.amount,
    title: row.title,
    kaspiUrl: row.kaspiUrl,
  };
}

async function getSettings() {
  return { payment: paymentToJSON(await repo.getPayment()) };
}

// Валидируем и сливаем с текущими значениями.
async function updateSettings(incoming = {}) {
  const current = paymentToJSON(await repo.getPayment());
  const payment = {
    enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : current.enabled,
    design: PAY_BUTTON_DESIGNS.includes(incoming.design) ? incoming.design : current.design,
    amount: typeof incoming.amount === 'string' && incoming.amount.trim() ? incoming.amount.trim() : current.amount,
    title: typeof incoming.title === 'string' && incoming.title.trim() ? incoming.title.trim() : current.title,
    kaspiUrl: typeof incoming.kaspiUrl === 'string' ? incoming.kaspiUrl.trim() : current.kaspiUrl,
  };
  const row = await repo.upsertPayment(payment);
  return { payment: paymentToJSON(row) };
}

module.exports = { getSettings, updateSettings, paymentToJSON, DEFAULT_PAYMENT };
