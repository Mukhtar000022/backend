const { prisma } = require('../../../db');

module.exports = {
  getPayment: () => prisma.paymentSetting.findUnique({ where: { id: 1 } }),
  upsertPayment: (payment) =>
    prisma.paymentSetting.upsert({ where: { id: 1 }, update: payment, create: { id: 1, ...payment } }),
};
