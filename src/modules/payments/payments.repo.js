const { prisma } = require('../../../db');

module.exports = {
  create: (data) => prisma.payment.create({ data }),
  findMany: () => prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }),
  update: (id, data) => prisma.payment.update({ where: { id }, data }),
  remove: (id) => prisma.payment.delete({ where: { id } }),
};
